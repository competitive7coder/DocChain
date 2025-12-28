# Scan & Share - Backend API

Express.js backend for the Scan & Share clinical workflow system.

## 🚀 Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Create `.env` file**:
   ```env
   MONGODB_URL=mongodb+srv://username:password@cluster.mongodb.net/scan-share?retryWrites=true&w=majority
   DATABASE_NAME=scan-share
   SECRET_KEY=your-secret-key-min-32-chars
   PORT=8001
   NODE_ENV=development
   ```

3. **Start server**:
   ```bash
   npm run dev
   ```

Server runs on `http://localhost:8001`

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Register (patient/doctor)
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Clinics
- `POST /api/clinics` - Create clinic (doctor)
- `GET /api/clinics/my-clinics` - Get my clinics (doctor)
- `GET /api/clinics/qr/:qrToken` - Get clinic by QR token (public)

### Visits
- `POST /api/visits/check-in` - Check-in patient
- `GET /api/visits/waiting-room/:clinicId` - Get waiting room (doctor)
- `POST /api/visits/start/:visitId` - Start visit (doctor)
- `GET /api/visits/:visitId` - Get visit details

### Prescriptions
- `POST /api/prescriptions/issue` - Issue prescription (doctor)
- `GET /api/prescriptions/my-prescriptions` - Get my prescriptions (patient)
- `GET /api/prescriptions/hash/:hashId` - Get prescription by hash (public)

