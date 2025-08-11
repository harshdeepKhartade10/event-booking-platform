# Event Booking Platform (MERN Stack)

A comprehensive, production-ready event booking platform built with the MERN stack (MongoDB, Express.js, React.js with Vite, Node.js). Users can browse, book, and manage event seats, while administrators have full event and user management control.

## Features

### User Side
- Account registration with email verification
- Secure JWT login/logout
- Browse/search/filter events
- View event details and book seats
- View booking history (past/upcoming)

### Admin Side
- Create, update, and delete events
- Manage seat limits
- View all bookings and analytics
- Manage users and view their bookings

### Technology
- **Backend:** Node.js, Express.js, MongoDB, JWT, Nodemailer
- **Frontend:** React.js (Vite, .jsx), Redux Toolkit, Axios
- **Containerization:** Docker, docker-compose

## Prerequisites
- Node.js 20+
- Docker & Docker Compose (for containerized setup)
- MongoDB (local or Docker)

## Setup Instructions

### 1. Clone the Repository
```bash
git clone <your_repo_url>
cd event-booking-platform-mern
```

### 2. Environment Variables
- Copy `.env.example` to `.env` in both `backend/` and `frontend/` and fill in the required values.
## Environment Variables

### Backend
```env
PORT=5000
# Local MongoDB
MONGO_URI=mongodb://localhost:27017/eventbooking
# OR Cloud MongoDB
MONGO_URI=mongodb+srv://<USERNAME>:<PASSWORD>@<CLUSTER_NAME>.mongodb.net/eventbooking
JWT_SECRET=YOUR_RANDOM_SECRET_KEY
EMAIL_USER=YOUR_EMAIL_ADDRESS
EMAIL_PASS=YOUR_EMAIL_PASSWORD_OR_APP_PASSWORD
CLIENT_URL=http://localhost:5173
RAZORPAY_KEY_ID=YOUR_RAZORPAY_KEY_ID
RAZORPAY_KEY_SECRET=YOUR_RAZORPAY_KEY_SECRET


### Frontend
VITE_API_URL=http://localhost:5000
```
### 3. Run with Docker (Recommended)
```bash
docker-compose up --build
```
- Backend: http://localhost:5000
- Frontend: http://localhost:5173
- MongoDB: mongodb://localhost:27017/eventbooking

### 4. Run Locally (Manual)
#### Backend
```bash
cd backend
npm install
cp .env.example .env
npm run seed # (optional, to insert demo data)
npm run dev
```
#### Frontend
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

## Demo Accounts
- **Admin:** admin@example.com / Admin@123
- **User:** user@example.com / User@123

## Sample Data
- Several demo events and bookings are seeded for testing.

## Environment Variables
See `.env.example` in both `backend/` and `frontend/` for all required variables.

## Docker Setup
- All services (frontend, backend, MongoDB) are containerized.
- Data is persisted via Docker volume.

## Project Structure
```
backend/      # Node.js/Express API
frontend/     # React Vite app
```

## Advanced Features (Bonus)
- Real-time seat updates
- Email notifications (Nodemailer)

## License
MIT

---

**For any issues or contributions, please open an issue or pull request.**
