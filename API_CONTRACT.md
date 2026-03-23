# API Contract - ResolveAI Complaint Management System

## Base URL
- **Development:** `http://localhost:5000`
- **Environment Variable:** `VITE_API_URL` (frontend)

## Authentication

### Token-Based Authentication
All protected endpoints require an `Authorization` header with a Bearer token:
```
Authorization: Bearer <token>
```

Tokens are obtained via login and expire after 24 hours.

---

## API Endpoints

### Health Check
```
GET /api/health
```
**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-02-21T20:45:00"
}
```

---

### Authentication

#### Login
```
POST /api/auth/login
```
**Request Body:**
```json
{
  "email": "user@gmail.com",
  "password": "user123"
}
```

**Response (201):**
```json
{
  "token": "secure_token_here",
  "role": "user",
  "name": "Customer",
  "email": "user@gmail.com"
}
```

**Demo Credentials:**
- User: `user@gmail.com` / `user123`
- Admin: `admin@1223` / `admim123`

#### Logout
```
POST /api/auth/logout
Authorization: Bearer <token>
```
**Response:**
```json
{
  "status": "logged out"
}
```

---

### Complaints

#### Create Complaint
```
POST /api/complaints
```
**Request Body:**
```json
{
  "subject": "Refund delayed",
  "email": "customer@example.com",
  "phone": "+91 9000000000",
  "language": "English",
  "complaint_text": "I submitted a refund request but haven't received it...",
  "attachment_name": "receipt.pdf"
}
```

**Response (201):**
```json
{
  "reference_id": "CMP-ABC123DEF45",
  "predicted_product": "Payments",
  "priority": "High",
  "department": "Finance",
  "escalation_status": "Normal",
  "ai_response": "We understand your concern...",
  "email_sent": true,
  "sms_sent": true
}
```

#### List Complaints
```
GET /api/complaints?email=user@example.com
```
**Query Parameters:**
- `email` (optional) - Filter by customer email

**Response (200):**
```json
[
  {
    "id": 1,
    "reference_id": "CMP-ABC123DEF45",
    "subject": "Refund delayed",
    "email": "customer@example.com",
    "phone": "+91 9000000000",
    "language": "English",
    "complaint_text": "...",
    "attachment_name": "receipt.pdf",
    "predicted_product": "Payments",
    "priority": "High",
    "department": "Finance",
    "escalation_status": "Normal",
    "ai_response": "...",
    "status": "Open",
    "created_at": "2026-02-21T20:45:00",
    "updated_at": "2026-02-21T20:45:00"
  }
]
```

#### Get Complaint Details
```
GET /api/complaints/<reference_id>
```

**Response (200):**
```json
{
  "id": 1,
  "reference_id": "CMP-ABC123DEF45",
  "subject": "...",
  "email": "...",
  "priority": "High",
  "status": "Open",
  "created_at": "2026-02-21T20:45:00"
}
```

#### Update Complaint (Within 24 Hours)
```
PUT /api/complaints/<reference_id>
```
**Request Body:**
```json
{
  "subject": "Updated subject",
  "complaint_text": "Updated complaint text",
  "attachment_name": "new_receipt.pdf"
}
```

**Response (200):**
```json
{
  "status": "updated"
}
```

#### Submit Feedback
```
POST /api/complaints/<reference_id>/feedback
```
**Request Body:**
```json
{
  "rating": 4,
  "comment": "Good response time"
}
```

**Response (201):**
```json
{
  "status": "received"
}
```

#### Download PDF Report
```
GET /api/complaints/<reference_id>/report
```

**Response:** PDF file

---

### Statistics & Analytics

#### User Stats
```
GET /api/stats/user/<email>
```

**Response (200):**
```json
{
  "total": 5,
  "open": 2,
  "resolved": 3,
  "critical": 0
}
```

#### Admin Stats
```
GET /api/stats/admin
```

**Response (200):**
```json
{
  "total": 250,
  "critical": 12,
  "today": 18,
  "resolved": 195,
  "escalated": 8
}
```

#### Comprehensive Analytics
```
GET /api/analytics
```

**Response (200):**
```json
{
  "totals": {
    "total": 250,
    "critical": 12,
    "resolved": 195,
    "today": 18
  },
  "by_product": [
    {"label": "Payments", "value": 85},
    {"label": "Billing", "value": 60}
  ],
  "by_priority": [
    {"label": "Low", "value": 120},
    {"label": "Medium", "value": 83}
  ],
  "by_department": [
    {"label": "Finance", "value": 145},
    {"label": "Operations", "value": 60}
  ],
  "by_month": [
    {"month": "Sep", "value": 180},
    {"month": "Oct", "value": 240}
  ]
}
```

---

## Error Handling

### Standard Error Responses

**400 - Bad Request:**
```json
{
  "error": "Missing required fields: subject, email, complaint_text"
}
```

**401 - Unauthorized:**
```json
{
  "error": "Invalid or expired token"
}
```

**404 - Not Found:**
```json
{
  "error": "Complaint not found"
}
```

**409 - Conflict:**
```json
{
  "error": "Duplicate complaint - try again"
}
```

**500 - Internal Server Error:**
```json
{
  "error": "Internal server error"
}
```

---

## Data Types

### Priority Levels
- `Low`
- `Medium`  
- `High`
- `Critical`

### Status Values
- `Open`
- `In Review`
- `Assigned`
- `Escalated`
- `Resolved`

### Escalation Status
- `Normal`
- `Escalated`

### Departments
- `Finance`
- `Operations`
- `Security`
- `Digital Experience`
- `Customer Care`
- `Executive Escalations`

### Products
- `Billing`
- `Payments`
- `Logistics`
- `Mobile App`
- `Authentication`
- `General Services`

---

## Rate Limiting
No rate limiting in development. Production should implement per-user limits.

---

## CORS Configuration
- **Origin:** Configured for `localhost:5173`
- **Credentials:** Supported
- **Headers:** `Content-Type`, `Authorization`
- **Methods:** `GET`, `POST`, `PUT`, `DELETE`, `OPTIONS`

