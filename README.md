# AI-Based Customer Complaint Management & Resolution Support System

This repository contains a full-stack complaint management platform with a React (Vite) frontend and a Flask backend. The system supports complaint intake, ML/NLP analysis, routing, AI response generation, and admin analytics.

## Tech Stack

Frontend:
- React (Vite)
- HTML, CSS, JavaScript

Backend:
- Python
- Flask (REST APIs)

AI/ML:
- Scikit-learn
- TF-IDF
- Logistic Regression
- Joblib model loading

Database:
- SQLite

## Project Structure

- frontend: React application
- backend: Flask API and SQLite database

## Setup

### Backend

1. Create a virtual environment and install dependencies:

   pip install -r backend/requirements.txt

2. Add your model files to backend/models.
   - product_vectorizer.pkl
   - product_model.pkl
   - product_label_encoder.pkl
   - priority_rules.pkl (or priority_model.pkl)
   If your files are in the project root, set MODEL_DIR to the repo root path in local.env.

3. (Optional) Email sending via SMTP:
   - SMTP_HOST
   - SMTP_PORT
   - SMTP_USER
   - SMTP_PASSWORD
   - SMTP_SENDER

3. Create a .env file (see .env.example) and set values as needed.

4. Run the server:

   python backend/app.py

### Frontend

1. Install dependencies:

   npm install

2. Start the dev server:

   npm run dev

## Demo Credentials

- User: user@gmail.com / user123
- Admin: admin@1223 / admim123
