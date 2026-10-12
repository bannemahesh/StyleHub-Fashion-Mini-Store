# StyleHub – Fashion Mini Store

## 1. Project Overview

StyleHub is a full-stack fashion e-commerce application.
Users can register, log in, browse fashion products, add
products to their cart, and purchase products using Stripe
test payments.

## 2. Technologies Used

### Frontend
- React.js
- Vite
- JavaScript
- HTML
- CSS

### Backend
- Python
- FastAPI
- SQLAlchemy

### Database
- SQLite

### Authentication
- JWT Authentication

### Payment Integration
- Stripe Test Mode

## 3. Main Features

- User registration
- User login
- JWT-based authentication
- Product listing
- Product details
- Shopping cart
- Checkout
- Stripe test payments
- Payment webhook processing
- Order history
- Order details
- Product stock management
- Product creation, updating, and deletion through backend APIs

## 4. Project Structure

StyleHub/
|
|-- backend/
|   |-- app/
|   |   |-- main.py
|   |   |-- database.py
|   |   |-- models/
|   |   |-- schemas/
|   |   |-- routers/
|   |-- requirements.txt
|   |-- .env
|
|-- frontend/
|   |-- src/
|   |-- public/
|   |-- package.json
|
|-- README.md
|-- .gitignore

Note: The structure above is illustrative. Keep your
actual project structure if it differs.

## 5. Backend Installation

Open Command Prompt:

    cd /d M:\Desktop\StyleHub\backend

Create a virtual environment if you do not already have one:

    python -m venv venv

Activate it:

    venv\Scripts\activate

Install dependencies:

    pip install -r requirements.txt

Start the backend:

    uvicorn app.main:app --reload

Backend API documentation:

    http://127.0.0.1:8000/docs

## 6. Frontend Installation

Open another terminal:

    cd /d M:\Desktop\StyleHub\frontend

Install frontend dependencies:

    npm install

Start the frontend:

    npm run dev

Open the local URL displayed in the terminal.
The usual Vite development URL is:

    http://localhost:5173

## 7. Stripe Test Payment

StyleHub uses Stripe Test Mode for payment testing.

1. Configure the Stripe test secret key.
2. Start the backend.
3. Start the frontend.
4. Start Stripe CLI if webhook testing is required.
5. Complete a test payment.
6. Verify the order and payment status.

Webhook command used during development:

    stripe listen --events checkout.session.completed --forward-to http://localhost:8000/payments/webhook

Use Stripe test card details from the official Stripe
documentation. Never use real card details for testing.

## 8. Testing

Test the following features before submission:

- User registration
- User login
- Product listing
- Product details
- Shopping cart
- Checkout
- Stripe test payment
- Payment webhook
- Order history
- Order details
- Stock updates
- Product images

## 9. Security

- Never upload secret keys or passwords.
- Keep the real .env file private.
- Protect product modification APIs with administrator authorization
  before deploying the application publicly.
- Use test credentials for payment testing.

## 10. Conclusion

StyleHub demonstrates a full-stack e-commerce workflow using
React, FastAPI, SQLite, JWT authentication, and Stripe test payments.