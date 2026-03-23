import os
import re
import sqlite3
import uuid
import secrets
import logging
from datetime import datetime, timedelta

import joblib
import requests
from fpdf import FPDF
from flask import Flask, jsonify, request, send_file
from flask_cors import CORS
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app, supports_credentials=True, 
     allow_headers=["Content-Type", "Authorization"],
     expose_headers=["Content-Type"])

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(BASE_DIR)

# Load environment variables from local.env and .env files
env_path_local = os.path.join(ROOT_DIR, "local.env")
env_path = os.path.join(ROOT_DIR, ".env")

if os.path.exists(env_path_local):
    load_dotenv(env_path_local)
if os.path.exists(env_path):
    load_dotenv(env_path)

# Configuration with fallbacks
MODEL_DIR = os.getenv("MODEL_DIR", ROOT_DIR)
DB_PATH = os.getenv("DB_PATH", os.path.join(BASE_DIR, "data", "complaints.db"))
SECRET_KEY = os.getenv("SECRET_KEY", secrets.token_hex(32))

USER_DEMO_EMAIL = os.getenv("USER_DEMO_EMAIL", "user@gmail.com")
USER_DEMO_PASSWORD = os.getenv("USER_DEMO_PASSWORD", "user123")
ADMIN_DEMO_EMAIL = os.getenv("ADMIN_DEMO_EMAIL", "admin@1223")
ADMIN_DEMO_PASSWORD = os.getenv("ADMIN_DEMO_PASSWORD", "admim123")

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "openai/gpt-4o-mini")

SMTP_HOST = os.getenv("SMTP_HOST", "")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_SENDER = os.getenv("SMTP_SENDER", SMTP_USER)

# Token storage (in production, use Redis or database)
_active_tokens = {}

product_vectorizer = None
product_model = None
product_label_encoder = None
priority_model = None


def _now_iso():
    """Get current UTC time in ISO format"""
    return datetime.utcnow().isoformat()


def _connect_db():
    """Create and return a database connection"""
    try:
        os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA foreign_keys = ON")
        return conn
    except Exception as e:
        logger.error(f"Database connection error: {str(e)}")
        raise


def _init_db():
    """Initialize database schema"""
    try:
        conn = _connect_db()
        cur = conn.cursor()
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS complaints (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                reference_id TEXT UNIQUE NOT NULL,
                subject TEXT NOT NULL,
                email TEXT NOT NULL,
                phone TEXT,
                language TEXT,
                complaint_text TEXT NOT NULL,
                attachment_name TEXT,
                predicted_product TEXT,
                priority TEXT DEFAULT 'Low',
                department TEXT,
                escalation_status TEXT DEFAULT 'Normal',
                ai_response TEXT,
                status TEXT DEFAULT 'Open',
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
            """
        )
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS feedback (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                reference_id TEXT NOT NULL,
                rating INTEGER CHECK(rating >= 1 AND rating <= 5),
                comment TEXT,
                created_at TEXT NOT NULL,
                FOREIGN KEY(reference_id) REFERENCES complaints(reference_id)
            )
            """
        )
        conn.commit()
        conn.close()
        logger.info("Database initialized successfully")
    except Exception as e:
        logger.error(f"Database initialization error: {str(e)}")
        raise


def _load_models():
    """Load ML models with comprehensive error handling"""
    global product_vectorizer, product_model, product_label_encoder, priority_model
    candidates = [MODEL_DIR, os.path.join(BASE_DIR, "models")]

    def _first_match(filename):
        for base in candidates:
            path = os.path.join(base, filename)
            if os.path.exists(path):
                return path
        return None

    try:
        vectorizer_path = _first_match("product_vectorizer.pkl") or _first_match("vectorizer.pkl")
        product_model_path = _first_match("product_model.pkl")
        product_label_path = _first_match("product_label_encoder.pkl")
        priority_model_path = _first_match("priority_rules.pkl") or _first_match("priority_model.pkl")

        if vectorizer_path:
            product_vectorizer = joblib.load(vectorizer_path)
            logger.info("Loaded product vectorizer")
        else:
            logger.warning("product_vectorizer.pkl not found - using rule-based fallback")

        if product_model_path:
            product_model = joblib.load(product_model_path)
            logger.info("Loaded product model")

        if product_label_path:
            product_label_encoder = joblib.load(product_label_path)
            logger.info("Loaded product label encoder")

        if priority_model_path:
            priority_model = joblib.load(priority_model_path)
            logger.info("Loaded priority model")
    except Exception as e:
        logger.warning(f"Error loading models: {str(e)} - will use fallback rules")


def _generate_token():
    """Generate a secure API token"""
    return secrets.token_urlsafe(32)


def _validate_token(token):
    """Validate an API token and return session data"""
    if not token or token not in _active_tokens:
        return None
    session = _active_tokens[token]
    if datetime.fromisoformat(session["expires_at"]) < datetime.utcnow():
        del _active_tokens[token]
        return None
    return session


def _preprocess(text):
    """Preprocess complaint text for ML"""
    if not text:
        return ""
    cleaned = re.sub(r"[^a-zA-Z0-9\s]", " ", text.lower())
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    return cleaned


def _predict_product(text):
    """Predict product category with error handling"""
    if not text:
        return "General Services"
    
    try:
        if product_vectorizer is not None and product_model is not None:
            vec = product_vectorizer.transform([text])
            pred = product_model.predict(vec)[0]
            if product_label_encoder is not None:
                return str(product_label_encoder.inverse_transform([pred])[0])
            return str(pred)
    except Exception as e:
        logger.warning(f"Error in product prediction: {str(e)}")

    # Rule-based fallback
    rules = {
        "billing": "Billing",
        "refund": "Payments",
        "charge": "Payments",
        "delivery": "Logistics",
        "late": "Logistics",
        "app": "Mobile App",
        "login": "Authentication",
        "password": "Authentication",
    }
    for key, value in rules.items():
        if key in text.lower():
            return value
    return "General Services"


def _predict_priority(text):
    """Predict priority level with error handling"""
    if not text:
        return "Low"
    
    try:
        if priority_model is not None and product_vectorizer is not None:
            vec = product_vectorizer.transform([text])
            if hasattr(priority_model, "predict"):
                return str(priority_model.predict(vec)[0])
            if isinstance(priority_model, dict):
                for key, value in priority_model.items():
                    if key in text:
                        return str(value)
    except Exception as e:
        logger.warning(f"Error in priority prediction: {str(e)}")

    # Rule-based fallback
    text_lower = text.lower()
    critical = ["fraud", "security", "breach", "data loss", "legal"]
    high = ["urgent", "chargeback", "unusable", "blocked"]
    medium = ["delay", "broken", "bug", "incorrect"]

    if any(word in text_lower for word in critical):
        return "Critical"
    if any(word in text_lower for word in high):
        return "High"
    if any(word in text_lower for word in medium):
        return "Medium"
    return "Low"


def _route_department(product, priority):
    """Route complaint to appropriate department"""
    if priority == "Critical":
        return "Executive Escalations"
    mapping = {
        "Billing": "Finance",
        "Payments": "Finance",
        "Logistics": "Operations",
        "Mobile App": "Digital Experience",
        "Authentication": "Security",
        "General Services": "Customer Care",
    }
    return mapping.get(product, "Customer Care")


def _generate_ai_response(payload):
    """Generate AI response using OpenRouter API with fallback"""
    if not OPENROUTER_API_KEY:
        logger.info("OpenRouter API key not configured - using fallback response")
        return (
            "We have received your complaint and our team is reviewing it. "
            "A specialist will contact you shortly with next steps."
        )

    try:
        prompt = (
            "You are a customer support specialist. Provide a concise, "
            "empathetic response and next steps.\n\n"
            f"Subject: {payload.get('subject', '')}\n"
            f"Complaint: {payload.get('complaint_text', '')}\n"
            f"Priority: {payload.get('priority', '')}\n"
            f"Department: {payload.get('department', '')}\n"
        )

        headers = {
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "Content-Type": "application/json",
        }
        body = {
            "model": OPENROUTER_MODEL,
            "messages": [
                {"role": "system", "content": "You are an enterprise customer support AI."},
                {"role": "user", "content": prompt},
            ],
            "max_tokens": 220,
            "temperature": 0.4,
        }

        response = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            json=body,
            headers=headers,
            timeout=20,
        )
        response.raise_for_status()
        data = response.json()
        return data["choices"][0]["message"]["content"].strip()
    except requests.exceptions.RequestException as e:
        logger.error(f"OpenRouter API error: {str(e)}")
        return (
            "We have received your complaint and are escalating it for review. "
            "Thank you for your patience while we investigate."
        )
    except Exception as e:
        logger.error(f"AI response generation error: {str(e)}")
        return (
            "We have received your complaint and will respond shortly. "
            "Thank you for contacting us."
        )


def _send_email(recipient, subject, body):
    """Send email with comprehensive error handling"""
    if not SMTP_HOST or not SMTP_USER or not SMTP_PASSWORD:
        logger.debug("SMTP not configured - email not sent")
        return False
    
    try:
        import smtplib
        from email.message import EmailMessage

        message = EmailMessage()
        message["Subject"] = subject
        message["From"] = SMTP_SENDER
        message["To"] = recipient
        message.set_content(body)

        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.send_message(message)
        
        logger.info(f"Email sent to {recipient}")
        return True
    except smtplib.SMTPAuthenticationError:
        logger.error("SMTP authentication failed")
        return False
    except smtplib.SMTPException as e:
        logger.error(f"SMTP error: {str(e)}")
        return False
    except Exception as e:
        logger.error(f"Email sending error: {str(e)}")
        return False


def _serialize(row):
    """Convert database row to dictionary"""
    return dict(row) if row else None


def _create_pdf_report(record):
    """Create PDF report for a complaint"""
    try:
        pdf = FPDF()
        pdf.add_page()
        pdf.set_font("Helvetica", size=12)
        pdf.cell(0, 10, "Complaint Report", ln=1)
        pdf.cell(0, 8, f"Reference ID: {record.get('reference_id')}", ln=1)
        pdf.cell(0, 8, f"Subject: {record.get('subject')}", ln=1)
        pdf.cell(0, 8, f"Email: {record.get('email')}", ln=1)
        pdf.cell(0, 8, f"Product: {record.get('predicted_product')}", ln=1)
        pdf.cell(0, 8, f"Priority: {record.get('priority')}", ln=1)
        pdf.cell(0, 8, f"Department: {record.get('department')}", ln=1)
        pdf.multi_cell(0, 8, f"Complaint: {record.get('complaint_text')}")
        
        file_path = os.path.join(BASE_DIR, "data", f"{record['reference_id']}.pdf")
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        pdf.output(file_path)
        logger.info(f"PDF report created: {file_path}")
        return file_path
    except Exception as e:
        logger.error(f"PDF generation error: {str(e)}")
        raise


def _require_auth():
    """Decorator to require authentication"""
    def decorator(f):
        def wrapper(*args, **kwargs):
            auth_header = request.headers.get("Authorization", "")
            if not auth_header.startswith("Bearer "):
                return jsonify({"error": "Missing or invalid authorization header"}), 401
            
            token = auth_header[7:]
            session = _validate_token(token)
            if not session:
                return jsonify({"error": "Invalid or expired token"}), 401
            
            # Add session to kwargs for the route handler
            kwargs["session"] = session
            return f(*args, **kwargs)
        
        wrapper.__name__ = f.__name__
        return wrapper
    return decorator


@app.route("/api/health", methods=["GET"])
def health():
    """Health check endpoint"""
    try:
        conn = _connect_db()
        conn.cursor().execute("SELECT 1")
        conn.close()
        return jsonify({"status": "ok", "timestamp": _now_iso()}), 200
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route("/api/auth/login", methods=["POST"])
def login():
    """Authenticate user and return token"""
    try:
        payload = request.get_json(force=True)
        email = payload.get("email", "").strip()
        password = payload.get("password", "").strip()

        if not email or not password:
            return jsonify({"error": "Email and password are required"}), 400

        user_data = None
        if email == ADMIN_DEMO_EMAIL and password == ADMIN_DEMO_PASSWORD:
            user_data = {"role": "admin", "name": "Admin", "email": email}
        elif email == USER_DEMO_EMAIL and password == USER_DEMO_PASSWORD:
            user_data = {"role": "user", "name": "Customer", "email": email}
        else:
            logger.warning(f"Failed login attempt for email: {email}")
            return jsonify({"error": "Invalid credentials"}), 401

        # Generate token
        token = _generate_token()
        _active_tokens[token] = {
            "user": user_data,
            "expires_at": (datetime.utcnow() + timedelta(hours=24)).isoformat()
        }

        return jsonify({
            "token": token,
            "role": user_data["role"],
            "name": user_data["name"],
            "email": user_data["email"]
        }), 200

    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500


@app.route("/api/auth/logout", methods=["POST"])
def logout():
    """Logout and invalidate token"""
    try:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
            if token in _active_tokens:
                del _active_tokens[token]
        return jsonify({"status": "logged out"}), 200
    except Exception as e:
        logger.error(f"Logout error: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500


@app.route("/api/complaints", methods=["POST"])
def create_complaint():
    """Create a new complaint with ML analysis"""
    try:
        payload = request.get_json(force=True)
        
        # Validate required fields
        required_fields = ["subject", "email", "complaint_text"]
        if not all(payload.get(field) for field in required_fields):
            return jsonify({"error": "Missing required fields: subject, email, complaint_text"}), 400

        complaint_text = payload.get("complaint_text", "").strip()
        subject = payload.get("subject", "").strip()
        email = payload.get("email", "").strip()
        phone = payload.get("phone", "").strip()
        language = payload.get("language", "").strip()
        attachment_name = payload.get("attachment_name", "").strip()

        # Perform ML analysis
        processed = _preprocess(complaint_text)
        predicted_product = _predict_product(processed)
        priority = _predict_priority(processed)
        department = _route_department(predicted_product, priority)
        escalation_status = "Escalated" if priority == "Critical" else "Normal"

        reference_id = f"CMP-{uuid.uuid4().hex[:10].upper()}"
        
        # Generate AI response
        ai_payload = {
            "subject": subject,
            "complaint_text": complaint_text,
            "priority": priority,
            "department": department,
        }
        ai_response = _generate_ai_response(ai_payload)
        
        # Send email
        email_subject = f"Complaint Received: {reference_id}"
        email_sent = _send_email(email, email_subject, ai_response)
        created_at = _now_iso()

        # Store in database
        conn = _connect_db()
        cur = conn.cursor()
        try:
            cur.execute(
                """
                INSERT INTO complaints (
                    reference_id, subject, email, phone, language, complaint_text,
                    attachment_name, predicted_product, priority, department,
                    escalation_status, ai_response, status, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    reference_id,
                    subject,
                    email,
                    phone,
                    language,
                    complaint_text,
                    attachment_name,
                    predicted_product,
                    priority,
                    department,
                    escalation_status,
                    ai_response,
                    "Open",
                    created_at,
                    created_at,
                ),
            )
            conn.commit()
            logger.info(f"Complaint created: {reference_id}")
        except sqlite3.IntegrityError as e:
            logger.error(f"Database integrity error: {str(e)}")
            conn.close()
            return jsonify({"error": "Duplicate complaint - try again"}), 409
        finally:
            conn.close()

        return jsonify(
            {
                "reference_id": reference_id,
                "predicted_product": predicted_product,
                "priority": priority,
                "department": department,
                "escalation_status": escalation_status,
                "ai_response": ai_response,
                "email_sent": email_sent,
                "sms_sent": True,
            }
        ), 201

    except ValueError as e:
        logger.error(f"Validation error: {str(e)}")
        return jsonify({"error": f"Invalid input: {str(e)}"}), 400
    except Exception as e:
        logger.error(f"Complaint creation error: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500


@app.route("/api/complaints", methods=["GET"])
def list_complaints():
    """Get complaints - optionally filtered by email"""
    try:
        email = request.args.get("email")
        conn = _connect_db()
        cur = conn.cursor()
        
        if email:
            cur.execute(
                "SELECT * FROM complaints WHERE email = ? ORDER BY created_at DESC LIMIT 100",
                (email,)
            )
            logger.info(f"Fetching complaints for email: {email}")
        else:
            cur.execute("SELECT * FROM complaints ORDER BY created_at DESC LIMIT 500")
        
        rows = [_serialize(row) for row in cur.fetchall()]
        conn.close()
        return jsonify(rows), 200

    except Exception as e:
        logger.error(f"List complaints error: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500


@app.route("/api/complaints/<reference_id>", methods=["GET"])
def get_complaint(reference_id):
    """Get detailed complaint information"""
    try:
        if not reference_id or not isinstance(reference_id, str):
            return jsonify({"error": "Invalid reference ID"}), 400

        conn = _connect_db()
        cur = conn.cursor()
        cur.execute("SELECT * FROM complaints WHERE reference_id = ?", (reference_id,))
        row = cur.fetchone()
        conn.close()
        
        if row is None:
            return jsonify({"error": "Complaint not found"}), 404
        
        return jsonify(_serialize(row)), 200

    except Exception as e:
        logger.error(f"Get complaint error: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500


@app.route("/api/complaints/<reference_id>", methods=["PUT"])
def update_complaint(reference_id):
    """Update complaint within 24-hour window"""
    try:
        if not reference_id:
            return jsonify({"error": "Invalid reference ID"}), 400

        payload = request.get_json(force=True)
        conn = _connect_db()
        cur = conn.cursor()
        cur.execute("SELECT * FROM complaints WHERE reference_id = ?", (reference_id,))
        row = cur.fetchone()
        
        if row is None:
            conn.close()
            return jsonify({"error": "Complaint not found"}), 404

        # Check editing window
        created_at = datetime.fromisoformat(row["created_at"])
        if datetime.utcnow() - created_at > timedelta(hours=24):
            conn.close()
            logger.warning(f"Edit attempt outside 24h window: {reference_id}")
            return jsonify({"error": "Editing window expired - complaints can only be edited within 24 hours"}), 403

        # Update with new data
        subject = payload.get("subject", row["subject"])
        complaint_text = payload.get("complaint_text", row["complaint_text"])
        attachment_name = payload.get("attachment_name", row["attachment_name"])
        
        processed = _preprocess(complaint_text)
        predicted_product = _predict_product(processed)
        priority = _predict_priority(processed)
        department = _route_department(predicted_product, priority)
        escalation_status = "Escalated" if priority == "Critical" else row["escalation_status"]

        ai_payload = {
            "subject": subject,
            "complaint_text": complaint_text,
            "priority": priority,
            "department": department,
        }
        ai_response = _generate_ai_response(ai_payload)

        cur.execute(
            """
            UPDATE complaints
            SET subject = ?, complaint_text = ?, attachment_name = ?, predicted_product = ?,
                priority = ?, department = ?, escalation_status = ?, ai_response = ?, updated_at = ?
            WHERE reference_id = ?
            """,
            (
                subject,
                complaint_text,
                attachment_name,
                predicted_product,
                priority,
                department,
                escalation_status,
                ai_response,
                _now_iso(),
                reference_id,
            ),
        )
        conn.commit()
        conn.close()
        logger.info(f"Complaint updated: {reference_id}")
        return jsonify({"status": "updated"}), 200

    except ValueError as e:
        logger.error(f"Update validation error: {str(e)}")
        return jsonify({"error": f"Invalid input: {str(e)}"}), 400
    except Exception as e:
        logger.error(f"Update complaint error: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500


@app.route("/api/complaints/<reference_id>/feedback", methods=["POST"])
def complaint_feedback(reference_id):
    """Submit feedback for a complaint"""
    try:
        if not reference_id:
            return jsonify({"error": "Invalid reference ID"}), 400

        payload = request.get_json(force=True)
        rating = int(payload.get("rating", 0))
        comment = payload.get("comment", "").strip()

        if not (1 <= rating <= 5):
            return jsonify({"error": "Rating must be between 1 and 5"}), 400

        conn = _connect_db()
        cur = conn.cursor()
        
        # Verify complaint exists
        cur.execute("SELECT * FROM complaints WHERE reference_id = ?", (reference_id,))
        if cur.fetchone() is None:
            conn.close()
            return jsonify({"error": "Complaint not found"}), 404

        # Insert feedback
        cur.execute(
            """
            INSERT INTO feedback (reference_id, rating, comment, created_at)
            VALUES (?, ?, ?, ?)
            """,
            (reference_id, rating, comment, _now_iso()),
        )
        conn.commit()
        conn.close()
        logger.info(f"Feedback received for complaint: {reference_id}")
        return jsonify({"status": "received"}), 201

    except ValueError as e:
        logger.error(f"Feedback validation error: {str(e)}")
        return jsonify({"error": f"Invalid input: {str(e)}"}), 400
    except Exception as e:
        logger.error(f"Feedback error: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500


@app.route("/api/complaints/<reference_id>/report", methods=["GET"])
def complaint_report(reference_id):
    """Download PDF report for complaint"""
    try:
        if not reference_id:
            return jsonify({"error": "Invalid reference ID"}), 400

        conn = _connect_db()
        cur = conn.cursor()
        cur.execute("SELECT * FROM complaints WHERE reference_id = ?", (reference_id,))
        row = cur.fetchone()
        conn.close()
        
        if row is None:
            return jsonify({"error": "Complaint not found"}), 404

        file_path = _create_pdf_report(_serialize(row))
        logger.info(f"PDF report downloaded: {reference_id}")
        return send_file(file_path, as_attachment=True, download_name=f"{reference_id}_report.pdf")

    except Exception as e:
        logger.error(f"Report generation error: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500


@app.route("/api/analytics", methods=["GET"])
def analytics():
    """Get comprehensive analytics data"""
    try:
        conn = _connect_db()
        cur = conn.cursor()
        
        # Totals
        cur.execute("SELECT COUNT(*) as total FROM complaints")
        total = cur.fetchone()["total"]
        
        cur.execute("SELECT COUNT(*) as critical FROM complaints WHERE priority = 'Critical'")
        critical = cur.fetchone()["critical"]
        
        cur.execute("SELECT COUNT(*) as resolved FROM complaints WHERE status = 'Resolved'")
        resolved = cur.fetchone()["resolved"]
        
        cur.execute("SELECT COUNT(*) as today FROM complaints WHERE date(created_at) = date('now')")
        today = cur.fetchone()["today"]

        # By product
        cur.execute(
            "SELECT predicted_product as product, COUNT(*) as count FROM complaints GROUP BY predicted_product ORDER BY count DESC"
        )
        by_product = [{"label": row["product"], "value": row["count"]} for row in cur.fetchall()]

        # By priority
        cur.execute(
            "SELECT priority, COUNT(*) as count FROM complaints GROUP BY priority ORDER BY count DESC"
        )
        by_priority = [{"label": row["priority"], "value": row["count"]} for row in cur.fetchall()]

        # By department
        cur.execute(
            "SELECT department, COUNT(*) as count FROM complaints GROUP BY department ORDER BY count DESC"
        )
        by_department = [{"label": row["department"], "value": row["count"]} for row in cur.fetchall()]

        # Monthly trends (last 6 months)
        cur.execute("""
            SELECT strftime('%b', created_at) as month, COUNT(*) as count 
            FROM complaints 
            WHERE created_at >= datetime('now', '-6 months')
            GROUP BY strftime('%Y-%m', created_at)
            ORDER BY created_at DESC
            LIMIT 6
        """)
        by_month = [{"month": row["month"], "value": row["count"]} for row in cur.fetchall()]

        conn.close()

        return jsonify({
            "totals": {
                "total": total,
                "critical": critical,
                "resolved": resolved,
                "today": today,
            },
            "by_product": by_product,
            "by_priority": by_priority,
            "by_department": by_department,
            "by_month": list(reversed(by_month)),
        }), 200

    except Exception as e:
        logger.error(f"Analytics error: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500


@app.route("/api/stats/user/<email>", methods=["GET"])
def user_stats(email):
    """Get user-specific complaint statistics"""
    try:
        if not email:
            return jsonify({"error": "Email is required"}), 400

        conn = _connect_db()
        cur = conn.cursor()
        
        cur.execute("SELECT COUNT(*) as total FROM complaints WHERE email = ?", (email,))
        total = cur.fetchone()["total"]
        
        cur.execute("SELECT COUNT(*) as open FROM complaints WHERE email = ? AND status = 'Open'", (email,))
        open_count = cur.fetchone()["open"]
        
        cur.execute("SELECT COUNT(*) as resolved FROM complaints WHERE email = ? AND status = 'Resolved'", (email,))
        resolved = cur.fetchone()["resolved"]
        
        cur.execute("SELECT COUNT(*) as critical FROM complaints WHERE email = ? AND priority = 'Critical'", (email,))
        critical = cur.fetchone()["critical"]

        conn.close()
        
        return jsonify({
            "total": total,
            "open": open_count,
            "resolved": resolved,
            "critical": critical
        }), 200

    except Exception as e:
        logger.error(f"User stats error: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500


@app.route("/api/stats/admin", methods=["GET"])
def admin_stats():
    """Get admin dashboard statistics"""
    try:
        conn = _connect_db()
        cur = conn.cursor()
        
        cur.execute("SELECT COUNT(*) as total FROM complaints")
        total = cur.fetchone()["total"]
        
        cur.execute("SELECT COUNT(*) as critical FROM complaints WHERE priority = 'Critical'")
        critical = cur.fetchone()["critical"]
        
        cur.execute("SELECT COUNT(*) as today FROM complaints WHERE date(created_at) = date('now')")
        today = cur.fetchone()["today"]
        
        cur.execute("SELECT COUNT(*) as resolved FROM complaints WHERE status = 'Resolved'")
        resolved = cur.fetchone()["resolved"]
        
        cur.execute("SELECT COUNT(*) as escalated FROM complaints WHERE escalation_status = 'Escalated'")
        escalated = cur.fetchone()["escalated"]

        conn.close()
        
        return jsonify({
            "total": total,
            "critical": critical,
            "today": today,
            "resolved": resolved,
            "escalated": escalated
        }), 200

    except Exception as e:
        logger.error(f"Admin stats error: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500


@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors"""
    return jsonify({"error": "Endpoint not found"}), 404


@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors"""
    logger.error(f"Unhandled exception: {str(error)}")
    return jsonify({"error": "Internal server error"}), 500


if __name__ == "__main__":
    try:
        logger.info("Initializing database...")
        _init_db()
        logger.info("Loading ML models...")
        _load_models()
        logger.info(f"Database path: {DB_PATH}")
        logger.info(f"Model directory: {MODEL_DIR}")
        logger.info("Starting Flask server on http://0.0.0.0:5000")
        app.run(host="0.0.0.0", port=5000, debug=True)
    except Exception as e:
        logger.error(f"Failed to start server: {str(e)}")
        raise
