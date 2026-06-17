# EstateVision ⚡

**Enterprise Property Management & Real Estate Analytics SaaS Platform**

EstateVision is a complete enterprise SaaS platform built with the MERN Stack and a Python FastAPI AI microservice. It enables property owners, tenants, and administrators to seamlessly manage properties, automate rental leases, accept secure credit card/UPI/netbanking payments via Razorpay, handle repair issues, and generate predictive analytics (price forecasting and ROI assessments).

---

## 🏗️ Architecture Stack

### Backend (`server/`)
*   **Runtime:** Node.js v20 (Express)
*   **Database:** MongoDB v7 (via Mongoose ODM) with geospatial querying & indexing
*   **Payment Gateway:** Razorpay API (HMAC Signature Verification + webhook endpoints)
*   **Emails:** Resend API (HTML transactional receipts)
*   **WebSockets:** Socket.io (real-time notification triggers and support messaging)

### Frontend (`client/`)
*   **Build Tool:** Vite v5
*   **Library:** React v18
*   **State Management:** Redux Toolkit
*   **Styling:** TailwindCSS v3.4 + Glassmorphism system
*   **Charts:** Recharts
*   **Icons:** Lucide React

### AI Service (`ai-service/`)
*   **Framework:** FastAPI (Python 3.11)
*   **Estimators:** XGBoost / Scikit-Learn
*   **Models:** Property price predictor, area trend analyzer, ROI projection engine

---

## 🚀 Getting Started

### Prerequisites
1.  Docker and Docker Compose installed.
2.  Node.js v20.
3.  Python 3.11 (if running AI microservice locally without Docker).

### Option 1: Run with Docker Compose (Recommended)
Spin up the entire stack including database, backend, frontend, and AI microservice:

```bash
docker-compose up --build
```

Access the apps at:
*   **Frontend Client:** [http://localhost:3000](http://localhost:3000)
*   **Backend Server:** [http://localhost:5000](http://localhost:5000)
*   **AI Microservice:** [http://localhost:8001/docs](http://localhost:8001/docs) (Swagger Docs)

---

## 🛠️ Local Development (Manual Setup)

If you prefer running the services separately for local debugging:

### 1. Environment Configuration
Create a `.env` file in the `server/` directory and `client/` directory based on `.env.example` in the root workspace.

### 2. Run Python AI Microservice
```bash
cd ai-service
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```

### 3. Run Node Express Backend
```bash
cd server
npm install
npm run dev
```

### 4. Run Vite React Client
```bash
cd client
npm install
npm run dev
```

---

## 🔒 Security & Best Practices
*   **Strict RBAC:** Middleware guards ensure only authenticated users can access targeted roles (Owner, Tenant, Admin).
*   **Robust Signature Verification:** Razorpay signature values are calculated using HMAC SHA256 against secret keys to prevent transactional tampering.
*   **Token Rotation:** Double JWT tokens configuration (access token + cookie-based HttpOnly refresh tokens) secures sessions.
*   **Geospatial Indexing:** Property location mapping utilizes `2dsphere` indexes to ensure lightning-fast radial lookups.
