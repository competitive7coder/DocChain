# Complete Project Documentation - All Details

This document contains comprehensive details about both projects in this repository:
1. **MedSecure** - Digital Prescription Validation System
2. **Scan & Share** - QR-based Clinical Workflow System

---

# 📋 Table of Contents

1. [MedSecure Project](#medsecure-project)
2. [Scan & Share Project](#scan--share-project)
3. [Project Structure Overview](#project-structure-overview)

---

# 🏥 MedSecure Project

## Overview
High-security digital prescription validation system to prevent double-spending using SHA-256 hashing and MongoDB Atlas.

## Technology Stack
- **Backend**: Express.js (Node.js)
- **Database**: MongoDB Atlas (Mongoose ODM)
- **Frontend**: React.js + Vite + Tailwind CSS + Framer Motion
- **Authentication**: JWT (jsonwebtoken)
- **Security**: bcryptjs (password hashing), SHA-256 (prescription hashing)
- **QR Codes**: html5-qrcode (scanning), qrcode.react (generation)

## Backend Structure (`backend-express/`)

### Configuration Files

#### `package.json`
**Location**: `backend-express/package.json`
**Purpose**: Node.js dependencies and scripts
**Key Dependencies**:
- `express` - Web framework
- `mongoose` - MongoDB ODM
- `jsonwebtoken` - JWT authentication
- `bcryptjs` - Password hashing
- `cors` - CORS middleware
- `express-validator` - Request validation
- `dotenv` - Environment variables

#### `.env.example`
**Location**: `backend-express/.env.example`
**Purpose**: Template for environment variables
**Variables**:
- `MONGODB_URL` - MongoDB Atlas connection string
- `DATABASE_NAME` - Database name
- `SECRET_KEY` - JWT secret key
- `ACCESS_TOKEN_EXPIRE_MINUTES` - Token expiration time
- `PORT` - Server port (default: 8000)

### Database Configuration

#### `config/database.js`
**Location**: `backend-express/config/database.js`
**Purpose**: MongoDB connection and index creation
**Exports**:
- `connectDB()` - Async function to connect to MongoDB and create indexes
**Used In**: `server.js` (on startup)

### Models (Mongoose Schemas)

#### `models/User.js`
**Location**: `backend-express/models/User.js`
**Purpose**: User model for Doctors and Pharmacists
**Schema Fields**:
- `username` (String, unique, indexed)
- `email` (String, unique, indexed)
- `hashed_password` (String)
- `role` (Enum: 'doctor', 'pharmacist')
- `full_name` (String)
- `created_at` (String - ISO timestamp)
**Methods**:
- `comparePassword(password)` - Compare password with hash
**Used In**: 
- `routes/auth.js` - Registration and login
- `middleware/auth.js` - User authentication

#### `models/Prescription.js`
**Location**: `backend-express/models/Prescription.js`
**Purpose**: Prescription document model
**Schema Fields**:
- `hash` (String, unique, indexed) - SHA-256 hash
- `patient_name` (String)
- `doctor_id` (String, indexed) - References User._id
- `medications` (Array) - Array of medication objects
- `status` (Enum: 'ACTIVE', 'REDEEMED', 'EXPIRED', indexed)
- `issued_at` (String)
- `redeemed_at` (String, nullable)
- `redeemed_by` (String, nullable) - References User._id
- `expires_at` (String, nullable)
**Used In**:
- `routes/prescription.js` - All prescription operations

#### `models/AuditLog.js`
**Location**: `backend-express/models/AuditLog.js`
**Purpose**: Audit trail for all prescription status changes
**Schema Fields**:
- `prescription_id` (String, indexed) - References Prescription._id
- `user_id` (String, indexed) - References User._id
- `action` (String) - e.g., 'ISSUED', 'REDEEMED', 'STATUS_CHANGED'
- `previous_status` (String, nullable)
- `new_status` (String, nullable)
- `timestamp` (String)
- `details` (Object, nullable) - Additional details as JSON
**Used In**:
- `routes/prescription.js` - Logging all prescription actions

### Middleware

#### `middleware/auth.js`
**Location**: `backend-express/middleware/auth.js`
**Purpose**: Authentication and authorization middleware
**Exports**:
- `authenticateToken(req, res, next)` - Verify JWT token and attach user to request
- `requireDoctor(req, res, next)` - Ensure user is a doctor
- `requirePharmacist(req, res, next)` - Ensure user is a pharmacist
**Used In**:
- All protected routes in `routes/auth.js` and `routes/prescription.js`

### Utilities

#### `utils/security.js`
**Location**: `backend-express/utils/security.js`
**Purpose**: Security-related utility functions
**Exports**:
- `hashPassword(password)` - Hash password using bcrypt
- `verifyPassword(password, hash)` - Verify password against hash
- `createAccessToken(payload)` - Generate JWT token
- `verifyToken(token)` - Verify and decode JWT token
- `hashPrescriptionData(patientName, doctorId, medications, timestamp)` - Generate SHA-256 hash for prescription
**Used In**:
- `routes/auth.js` - Password hashing and JWT creation
- `routes/prescription.js` - Prescription hashing

### Routes

#### `routes/auth.js`
**Location**: `backend-express/routes/auth.js`
**Purpose**: Authentication endpoints
**Endpoints**:
- `POST /auth/register` - Register new user (patient/pharmacist)
  - Validates: username, email, password, role, full_name
  - Returns: UserResponse with JWT token
- `POST /auth/login` - Login user
  - Validates: username, password
  - Returns: JWT token
- `GET /auth/me` - Get current user info (protected)
  - Middleware: `authenticateToken`
  - Returns: Current user details
**Used By**: Frontend `services/api.js` → `authAPI`

#### `routes/prescription.js`
**Location**: `backend-express/routes/prescription.js`
**Purpose**: Prescription management endpoints
**Endpoints**:
- `POST /prescriptions/issue` - Issue new prescription (doctor only)
  - Middleware: `authenticateToken`, `requireDoctor`
  - Validates: patient_name, medications array
  - Creates prescription with SHA-256 hash
  - Status: 'ACTIVE'
  - Creates audit log entry
- `GET /prescriptions/verify/:hash` - Verify prescription (pharmacist only)
  - Middleware: `authenticateToken`, `requirePharmacist`
  - Checks expiration, updates status if needed
  - Returns prescription details
- `POST /prescriptions/redeem` - Redeem prescription (pharmacist only)
  - Middleware: `authenticateToken`, `requirePharmacist`
  - Validates: hash
  - Changes status: 'ACTIVE' → 'REDEEMED'
  - Creates audit log entry
- `GET /prescriptions/my-prescriptions` - Get doctor's prescriptions
  - Middleware: `authenticateToken`
  - Returns all prescriptions issued by current doctor
- `GET /prescriptions/view/:hash` - Public view (no auth)
  - Allows patients to view their prescription QR code
  - Used for shareable links
**Used By**: Frontend `services/api.js` → `prescriptionAPI`

### Server Entry Point

#### `server.js`
**Location**: `backend-express/server.js`
**Purpose**: Express application setup and server initialization
**Key Features**:
- CORS configuration for React frontend
- Database connection on startup
- Route mounting: `/auth`, `/prescriptions`
- Error handling middleware
- Runs on port 8000
**Imports**:
- Database config
- All route modules
- CORS middleware

## Frontend Structure (`frontend/`)

### Configuration Files

#### `package.json`
**Location**: `frontend/package.json`
**Purpose**: React dependencies and scripts
**Key Dependencies**:
- `react`, `react-dom` - React framework
- `react-router-dom` - Routing
- `axios` - HTTP client
- `html5-qrcode` - QR code scanning
- `qrcode.react` - QR code generation
- `framer-motion` - Animations
- `tailwindcss` - CSS framework

#### `vite.config.js`
**Location**: `frontend/vite.config.js`
**Purpose**: Vite build configuration
**Features**:
- React plugin
- Dev server on port 5173
- Proxy configuration for API calls

#### `tailwind.config.js`
**Location**: `frontend/tailwind.config.js`
**Purpose**: Tailwind CSS configuration
**Custom Colors**: Primary color palette defined

### Services

#### `services/api.js`
**Location**: `frontend/src/services/api.js`
**Purpose**: API client functions for all backend endpoints
**Exports**:
- `authAPI` - Authentication API calls
  - `login(username, password)`
  - `register(userData)`
  - `getMe(token)`
- `prescriptionAPI` - Prescription API calls
  - `issue(prescriptionData, token)`
  - `verify(hash, token)`
  - `redeem(hash, token)`
  - `getMyPrescriptions(token)`
**API Base URL**: Auto-detects from `window.location` for mobile/tunnel support
**Used By**: All page components and contexts

### Contexts

#### `contexts/AuthContext.jsx`
**Location**: `frontend/src/contexts/AuthContext.jsx`
**Purpose**: Authentication state management
**State**:
- `user` - Current user object
- `token` - JWT token (stored in localStorage)
- `loading` - Loading state
**Functions**:
- `login(username, password)` - Login user
- `register(userData)` - Register new user
- `logout()` - Clear auth state
**Used By**: All protected routes via `useAuth()` hook

### Components

#### `components/QRScanner.jsx`
**Location**: `frontend/src/components/QRScanner.jsx`
**Purpose**: QR code scanner component using html5-qrcode
**Props**:
- `onScanSuccess(decodedText)` - Callback when QR code is scanned
- `onError(errorMessage)` - Error callback
**Used In**:
- `pages/PharmacyPortal.jsx` - Pharmacist scans prescription QR
- `pages/PatientDashboard.jsx` - Patient scans clinic QR (Scan & Share)

#### `components/PrescriptionQR.jsx`
**Location**: `frontend/src/components/PrescriptionQR.jsx`
**Purpose**: Display prescription QR code using qrcode.react
**Props**:
- `hash` - Prescription hash to encode in QR
**Used In**:
- `pages/DoctorDashboard.jsx` - Show QR after issuing prescription
- `pages/PatientView.jsx` - Patient view of prescription

#### `components/ProtectedRoute.jsx`
**Location**: `frontend/src/components/ProtectedRoute.jsx`
**Purpose**: Route protection wrapper
**Props**:
- `children` - Components to render
- `requiredRole` - Role required ('doctor' or 'pharmacist')
**Logic**: Checks authentication and role before rendering
**Used In**: `App.jsx` for all protected routes

### Pages

#### `pages/Login.jsx`
**Location**: `frontend/src/pages/Login.jsx`
**Purpose**: Login and registration page
**Features**:
- Tab switcher (Login/Register)
- Visual role selection (Doctor/Pharmacist cards)
- Form validation
- Error handling
**Routes To**:
- `/doctor` - After doctor login
- `/pharmacy` - After pharmacist login

#### `pages/DoctorDashboard.jsx`
**Location**: `frontend/src/pages/DoctorDashboard.jsx`
**Purpose**: Doctor's main interface
**Features**:
- Issue prescription form
  - Patient name input
  - Dynamic medication list (add/remove)
  - Medication fields: name, dosage, frequency, duration, instructions
- QR code display after issuance
- Shareable link feature (copies to clipboard)
  - Link format: `/prescription/:hash`
- Prescription history list
**API Calls**:
- `prescriptionAPI.issue()` - Create prescription
- `prescriptionAPI.getMyPrescriptions()` - Load history

#### `pages/PharmacyPortal.jsx`
**Location**: `frontend/src/pages/PharmacyPortal.jsx`
**Purpose**: Pharmacist's verification interface
**Features**:
- QR scanner toggle button
- Manual hash input field
- Prescription verification display
  - Patient info
  - Medications list
  - Status badge
- Redeem button (one-time only)
- Real-time status updates
**API Calls**:
- `prescriptionAPI.verify()` - Verify prescription
- `prescriptionAPI.redeem()` - Redeem prescription

#### `pages/PatientView.jsx`
**Location**: `frontend/src/pages/PatientView.jsx`
**Purpose**: Public patient view (no authentication required)
**Route**: `/prescription/:hash`
**Features**:
- Displays prescription QR code
- Shows medication details
- Copy shareable link button
- Patient-friendly design
**API Calls**:
- `prescriptionAPI.getPrescriptionByHash()` - Fetch prescription by hash

### Main Application Files

#### `App.jsx`
**Location**: `frontend/src/App.jsx`
**Purpose**: Main React application component with routing
**Routes**:
- `/login` - Login page
- `/doctor` - Doctor dashboard (protected, doctor role)
- `/pharmacy` - Pharmacy portal (protected, pharmacist role)
- `/prescription/:hash` - Public patient view
- `/` - Redirects to `/login`
**Wrappers**: `AuthProvider` for global auth state

#### `main.jsx`
**Location**: `frontend/src/main.jsx`
**Purpose**: React app entry point
**Renders**: `<App />` component to DOM

#### `index.css`
**Location**: `frontend/src/index.css`
**Purpose**: Global styles with Tailwind imports
**Content**: Tailwind directives + base styles

---

# 🏥 Scan & Share Project

## Overview
QR-based clinical workflow system that creates real-time visit sessions between patients and doctors, eliminating manual prescription sharing.

## Technology Stack
- **Backend**: Express.js (Node.js) + Socket.io
- **Database**: MongoDB Atlas (Mongoose ODM)
- **Frontend**: React.js + Vite + Tailwind CSS + Framer Motion
- **Real-time**: Socket.io for waiting room updates
- **QR Codes**: html5-qrcode (scanning), qrcode.react (generation)

## Backend Structure (`scan-share-backend/`)

### Configuration Files

#### `package.json`
**Location**: `scan-share-backend/package.json`
**Purpose**: Node.js dependencies and scripts
**Key Dependencies**:
- `express` - Web framework
- `mongoose` - MongoDB ODM
- `socket.io` - Real-time communication
- `jsonwebtoken` - JWT authentication
- `bcryptjs` - Password hashing
- `cors` - CORS middleware
- `express-validator` - Request validation

#### `.env.example`
**Location**: `scan-share-backend/.env.example`
**Purpose**: Environment variables template
**Variables**:
- `MONGODB_URL` - MongoDB Atlas connection
- `DATABASE_NAME` - Database name (default: scan-share)
- `SECRET_KEY` - JWT secret
- `PORT` - Server port (default: 8001)

### Database Configuration

#### `config/database.js`
**Location**: `scan-share-backend/config/database.js`
**Purpose**: MongoDB connection
**Exports**: `connectDB()` - Async connection function
**Used In**: `server.js` (on startup)

### Models (Mongoose Schemas)

#### `models/User.js`
**Location**: `scan-share-backend/models/User.js`
**Purpose**: User model (patients and doctors)
**Schema Fields**:
- `name` (String)
- `email` (String, unique, indexed)
- `password` (String - hashed)
- `role` (Enum: 'patient', 'doctor', 'admin', indexed)
- `phone` (String, optional)
- `dateOfBirth` (Date, optional)
- `createdAt` (Date)
**Used In**: All authentication and user-related operations

#### `models/Clinic.js`
**Location**: `scan-share-backend/models/Clinic.js`
**Purpose**: Clinic model with unique QR token
**Schema Fields**:
- `name` (String)
- `location` (String)
- `uniqueQrToken` (String, unique, indexed) - 64-char hex token
- `doctorId` (ObjectId, ref: User, indexed)
- `isActive` (Boolean, default: true)
- `createdAt` (Date)
**Key Feature**: Auto-generates `uniqueQrToken` on creation
**Used In**: 
- Clinic management routes
- Check-in process

#### `models/Visit.js`
**Location**: `scan-share-backend/models/Visit.js`
**Purpose**: Visit session model
**Schema Fields**:
- `clinicId` (ObjectId, ref: Clinic, indexed)
- `patientId` (ObjectId, ref: User, indexed)
- `status` (Enum: 'Waiting', 'In-Progress', 'Completed', 'Cancelled', indexed)
- `checkInTime` (Date, default: now)
- `startTime` (Date, nullable)
- `endTime` (Date, nullable)
- `notes` (String, optional)
**Indexes**: Multiple compound indexes for efficient queries
**Used In**: 
- Check-in process
- Waiting room queries
- Visit lifecycle management

#### `models/Prescription.js`
**Location**: `scan-share-backend/models/Prescription.js`
**Purpose**: Prescription model linked to visits
**Schema Fields**:
- `visitId` (ObjectId, ref: Visit, indexed)
- `patientId` (ObjectId, ref: User, indexed)
- `doctorId` (ObjectId, ref: User, indexed)
- `medications` (Array) - Array of medication objects
  - Each medication: { name, dosage, frequency, duration, instructions }
- `hashId` (String, unique, indexed) - SHA-256 hash for sharing
- `issuedAt` (Date, default: now)
- `notes` (String, optional)
**Used In**: 
- Prescription issuance
- Health Locker queries

### Controllers

#### `controllers/clinicController.js`
**Location**: `scan-share-backend/controllers/clinicController.js`
**Purpose**: Clinic business logic
**Exports**:
- `createClinic(req, res)` - Create new clinic (doctor only)
  - Generates unique QR token
  - Returns clinic with QR code URL
- `getMyClinics(req, res)` - Get doctor's clinics
  - Returns all active clinics for current doctor
- `getClinicByToken(req, res)` - Get clinic by QR token (public)
  - Used for check-in process
  - No authentication required
**Used By**: `routes/clinics.js`

#### `controllers/visitController.js`
**Location**: `scan-share-backend/controllers/visitController.js`
**Purpose**: Visit management logic
**Exports**:
- `checkIn(req, res)` - Patient check-in
  - Creates Visit with status 'Waiting'
  - Prevents duplicate active visits
  - Populates clinic and patient data
- `getWaitingRoom(req, res)` - Get waiting patients
  - Filters by clinic and status='Waiting'
  - Populates patient details
  - Calculates wait time
  - Doctor access only
- `startVisit(req, res)` - Start visit session
  - Changes status: 'Waiting' → 'In-Progress'
  - Sets startTime
  - Doctor access only
- `getVisit(req, res)` - Get visit details
  - Populates clinic, patient, prescription
  - Access control (patient or doctor)
**Used By**: `routes/visits.js`

#### `controllers/prescriptionController.js`
**Location**: `scan-share-backend/controllers/prescriptionController.js`
**Purpose**: Prescription management logic
**Exports**:
- `issuePrescription(req, res)` - Issue prescription
  - Creates Prescription document
  - Generates hashId (SHA-256)
  - Updates Visit status to 'Completed'
  - Sets Visit endTime
  - Doctor access only
- `getPatientPrescriptions(req, res)` - Health Locker
  - Gets all prescriptions for current patient
  - Populates doctor and clinic info
  - Sorted by issuedAt (newest first)
  - Patient access only
- `getPrescriptionByHash(req, res)` - Get by hash (public)
  - No authentication required
  - Used for sharing prescriptions
**Used By**: `routes/prescriptions.js`

### Middleware

#### `middleware/auth.js`
**Location**: `scan-share-backend/middleware/auth.js`
**Purpose**: Authentication and authorization
**Exports**:
- `authenticateToken(req, res, next)` - Verify JWT, attach user to req
- `requireRole(...roles)` - Role-based access control (returns middleware function)
**Used In**: All protected routes

### Utilities

#### `utils/security.js`
**Location**: `scan-share-backend/utils/security.js`
**Purpose**: Security utilities
**Exports**:
- `hashPassword()` - bcrypt password hashing
- `verifyPassword()` - Password verification
- `createAccessToken()` - JWT token generation
- `verifyToken()` - JWT verification
**Used In**: Authentication routes

### Routes

#### `routes/auth.js`
**Location**: `scan-share-backend/routes/auth.js`
**Purpose**: Authentication endpoints
**Endpoints**:
- `POST /api/auth/register` - Register (patient/doctor)
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user (protected)
**Used By**: Frontend `services/api.js` → `authAPI`

#### `routes/clinics.js`
**Location**: `scan-share-backend/routes/clinics.js`
**Purpose**: Clinic management endpoints
**Endpoints**:
- `POST /api/clinics` - Create clinic (doctor only)
- `GET /api/clinics/my-clinics` - Get my clinics (doctor only)
- `GET /api/clinics/qr/:qrToken` - Get clinic by QR token (public)
**Used By**: Frontend `services/api.js` → `clinicAPI`

#### `routes/visits.js`
**Location**: `scan-share-backend/routes/visits.js`
**Purpose**: Visit management endpoints
**Endpoints**:
- `POST /api/visits/check-in` - Check-in patient (patient only)
  - Body: { clinicId }
- `GET /api/visits/waiting-room/:clinicId` - Get waiting room (doctor only)
- `POST /api/visits/start/:visitId` - Start visit (doctor only)
- `GET /api/visits/:visitId` - Get visit details (patient/doctor)
**Used By**: Frontend `services/api.js` → `visitAPI`

#### `routes/prescriptions.js`
**Location**: `scan-share-backend/routes/prescriptions.js`
**Purpose**: Prescription endpoints
**Endpoints**:
- `POST /api/prescriptions/issue` - Issue prescription (doctor only)
  - Body: { visitId, medications[], notes }
- `GET /api/prescriptions/my-prescriptions` - Health Locker (patient only)
- `GET /api/prescriptions/hash/:hashId` - Get by hash (public)
**Used By**: Frontend `services/api.js` → `prescriptionAPI`

### Server Entry Point

#### `server.js`
**Location**: `scan-share-backend/server.js`
**Purpose**: Express app with Socket.io
**Key Features**:
- Socket.io server setup for real-time updates
- CORS configuration
- Database connection
- Route mounting: `/api/auth`, `/api/clinics`, `/api/visits`, `/api/prescriptions`
- Socket events: 'join-clinic', 'patient-checked-in', 'visit-updated'
- Runs on port 8001
**Socket.io Usage**:
- Doctors join clinic room: `socket.emit('join-clinic', clinicId)`
- Server broadcasts: `io.to('clinic-${clinicId}').emit('patient-checked-in')`

## Frontend Structure (`scan-share-frontend/`)

### Services

#### `services/api.js`
**Location**: `scan-share-frontend/src/services/api.js`
**Purpose**: API client functions
**Exports**:
- `authAPI` - login, register, getMe
- `clinicAPI` - createClinic, getMyClinics, getClinicByToken
- `visitAPI` - checkIn, getWaitingRoom, startVisit, getVisit
- `prescriptionAPI` - issuePrescription, getMyPrescriptions, getPrescriptionByHash
**Auto-detection**: API URL from `window.location` for mobile/tunnel support

### Contexts

#### `contexts/AuthContext.jsx`
**Location**: `scan-share-frontend/src/contexts/AuthContext.jsx`
**Purpose**: Authentication state management
**Functions**: login, register, logout
**Used By**: All protected routes

### Components

#### `components/QRScanner.jsx`
**Location**: `scan-share-frontend/src/components/QRScanner.jsx`
**Purpose**: QR code scanner (html5-qrcode)
**Used In**: `pages/PatientDashboard.jsx`

#### `components/ProtectedRoute.jsx`
**Location**: `scan-share-frontend/src/components/ProtectedRoute.jsx`
**Purpose**: Route protection with role checking
**Used In**: `App.jsx`

### Pages

#### `pages/Login.jsx`
**Location**: `scan-share-frontend/src/pages/Login.jsx`
**Purpose**: Login/Register page with role selection
**Routes To**: `/patient/dashboard` or `/doctor/dashboard`

#### `pages/PatientDashboard.jsx`
**Location**: `scan-share-frontend/src/pages/PatientDashboard.jsx`
**Purpose**: Patient check-in interface
**Features**:
- QR scanner for clinic QR code
- Check-in success display
- Clinic information display
**API Calls**:
- `clinicAPI.getClinicByToken()` - Get clinic from QR
- `visitAPI.checkIn()` - Create visit

#### `pages/DoctorDashboard.jsx`
**Location**: `scan-share-frontend/src/pages/DoctorDashboard.jsx`
**Purpose**: Doctor's clinic management
**Features**:
- Create clinic form
- Display all clinics with QR codes
- Navigate to waiting room
**API Calls**:
- `clinicAPI.createClinic()` - Create new clinic
- `clinicAPI.getMyClinics()` - Load clinics

#### `pages/WaitingRoom.jsx`
**Location**: `scan-share-frontend/src/pages/WaitingRoom.jsx`
**Purpose**: Real-time waiting room display
**Features**:
- Socket.io connection for real-time updates
- Auto-refresh every 30 seconds (polling fallback)
- List of waiting patients with wait times
- "Start Visit" button for each patient
**Real-time Updates**:
- Connects to Socket.io server
- Joins clinic room: `socket.emit('join-clinic', clinicId)`
- Listens for: 'patient-checked-in', 'visit-updated'
**API Calls**:
- `visitAPI.getWaitingRoom()` - Load waiting patients
- `visitAPI.startVisit()` - Start visit session

#### `pages/PrescriptionForm.jsx`
**Location**: `scan-share-frontend/src/pages/PrescriptionForm.jsx`
**Purpose**: Prescription issuance form
**Route**: `/doctor/prescription/:visitId`
**Features**:
- Patient information display
- Dynamic medication form (add/remove)
- Notes field
- Submit to issue prescription
**API Calls**:
- `visitAPI.getVisit()` - Load visit details
- `prescriptionAPI.issuePrescription()` - Create prescription

#### `pages/HealthLocker.jsx`
**Location**: `scan-share-frontend/src/pages/HealthLocker.jsx`
**Purpose**: Patient's prescription history
**Route**: `/patient/health-locker`
**Features**:
- List all patient's prescriptions
- Show QR code for each prescription
- Medication details display
- Doctor and clinic information
**API Calls**:
- `prescriptionAPI.getMyPrescriptions()` - Load prescriptions

### Main Application Files

#### `App.jsx`
**Location**: `scan-share-frontend/src/App.jsx`
**Purpose**: Main routing component
**Routes**:
- `/login` - Login page
- `/patient/dashboard` - Patient check-in (protected, patient role)
- `/patient/health-locker` - Health Locker (protected, patient role)
- `/doctor/dashboard` - Doctor dashboard (protected, doctor role)
- `/doctor/waiting-room/:clinicId` - Waiting room (protected, doctor role)
- `/doctor/prescription/:visitId` - Prescription form (protected, doctor role)
- `/` - Redirects to `/login`

---

# 📊 Project Structure Overview

## Directory Tree

```
.
├── backend-express/              # MedSecure Backend
│   ├── config/
│   │   └── database.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Prescription.js
│   │   └── AuditLog.js
│   ├── routes/
│   │   ├── auth.js
│   │   └── prescription.js
│   ├── middleware/
│   │   └── auth.js
│   ├── utils/
│   │   └── security.js
│   ├── server.js
│   └── package.json
│
├── scan-share-backend/          # Scan & Share Backend
│   ├── config/
│   │   └── database.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Clinic.js
│   │   ├── Visit.js
│   │   └── Prescription.js
│   ├── controllers/
│   │   ├── clinicController.js
│   │   ├── visitController.js
│   │   └── prescriptionController.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── clinics.js
│   │   ├── visits.js
│   │   └── prescriptions.js
│   ├── middleware/
│   │   └── auth.js
│   ├── utils/
│   │   └── security.js
│   ├── server.js
│   └── package.json
│
├── frontend/                    # MedSecure Frontend
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── DoctorDashboard.jsx
│   │   │   ├── PharmacyPortal.jsx
│   │   │   └── PatientView.jsx
│   │   ├── components/
│   │   │   ├── QRScanner.jsx
│   │   │   ├── PrescriptionQR.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   ├── contexts/
│   │   │   └── AuthContext.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
│
└── scan-share-frontend/         # Scan & Share Frontend
    ├── src/
    │   ├── pages/
    │   │   ├── Login.jsx
    │   │   ├── PatientDashboard.jsx
    │   │   ├── DoctorDashboard.jsx
    │   │   ├── WaitingRoom.jsx
    │   │   ├── PrescriptionForm.jsx
    │   │   └── HealthLocker.jsx
    │   ├── components/
    │   │   ├── QRScanner.jsx
    │   │   └── ProtectedRoute.jsx
    │   ├── contexts/
    │   │   └── AuthContext.jsx
    │   ├── services/
    │   │   └── api.js
    │   ├── App.jsx
    │   └── main.jsx
    └── package.json
```

---

# 🔑 Key Differences Between Projects

## MedSecure
- **Focus**: Prescription validation and double-spending prevention
- **Flow**: Doctor issues → Patient receives QR → Pharmacist verifies/redeems
- **Key Feature**: SHA-256 hashing for prescription integrity
- **Database**: 3 collections (User, Prescription, AuditLog)
- **Real-time**: Not implemented
- **Port**: Backend 8000, Frontend 5173

## Scan & Share
- **Focus**: Clinical workflow with visit sessions
- **Flow**: Patient checks in → Waiting room → Doctor starts visit → Prescription issued
- **Key Feature**: Real-time waiting room with Socket.io
- **Database**: 4 collections (User, Clinic, Visit, Prescription)
- **Real-time**: Socket.io for waiting room updates
- **Port**: Backend 8001, Frontend 5174

---

# 🛠️ Common Patterns Used

## Authentication Flow
1. User registers/logs in → Receives JWT token
2. Token stored in localStorage
3. Token sent in Authorization header: `Bearer <token>`
4. Middleware verifies token and attaches user to request
5. Role-based checks ensure proper access

## Error Handling
- Try-catch blocks in all async functions
- Consistent error response format: `{ error: "message" }` or `{ detail: "message" }`
- HTTP status codes: 400 (bad request), 401 (unauthorized), 403 (forbidden), 404 (not found), 500 (server error)

## API Response Patterns
- Success: Direct data object or `{ message: "...", data: {...} }`
- Error: `{ error: "message" }` or `{ detail: "message" }`
- Pagination: Not implemented (can be added)
- Validation: express-validator with error arrays

## Database Patterns
- Mongoose ODM for MongoDB
- References using ObjectId
- Populate() for joining related documents
- Indexes on frequently queried fields
- Timestamps stored as ISO strings

---

# 📝 Quick Reference

## MedSecure API Endpoints

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| POST | `/auth/register` | No | - | Register user |
| POST | `/auth/login` | No | - | Login |
| GET | `/auth/me` | Yes | Any | Get current user |
| POST | `/prescriptions/issue` | Yes | Doctor | Issue prescription |
| GET | `/prescriptions/verify/:hash` | Yes | Pharmacist | Verify prescription |
| POST | `/prescriptions/redeem` | Yes | Pharmacist | Redeem prescription |
| GET | `/prescriptions/my-prescriptions` | Yes | Doctor | Get my prescriptions |
| GET | `/prescriptions/view/:hash` | No | - | Public view (patient) |

## Scan & Share API Endpoints

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| POST | `/api/auth/register` | No | - | Register (patient/doctor) |
| POST | `/api/auth/login` | No | - | Login |
| GET | `/api/auth/me` | Yes | Any | Get current user |
| POST | `/api/clinics` | Yes | Doctor | Create clinic |
| GET | `/api/clinics/my-clinics` | Yes | Doctor | Get my clinics |
| GET | `/api/clinics/qr/:qrToken` | No | - | Get clinic by QR (public) |
| POST | `/api/visits/check-in` | Yes | Patient | Check-in patient |
| GET | `/api/visits/waiting-room/:clinicId` | Yes | Doctor | Get waiting room |
| POST | `/api/visits/start/:visitId` | Yes | Doctor | Start visit |
| GET | `/api/visits/:visitId` | Yes | Patient/Doctor | Get visit details |
| POST | `/api/prescriptions/issue` | Yes | Doctor | Issue prescription |
| GET | `/api/prescriptions/my-prescriptions` | Yes | Patient | Health Locker |
| GET | `/api/prescriptions/hash/:hashId` | No | - | Get by hash (public) |

---

# 🔒 Security Features

## Both Projects
- Password hashing with bcrypt (10 salt rounds)
- JWT token authentication
- Role-based access control (RBAC)
- CORS configuration
- Input validation with express-validator
- Environment variables for sensitive data

## MedSecure Specific
- SHA-256 hashing for prescription integrity
- One-time redemption (status change prevents reuse)
- Complete audit logging
- Public prescription view (hash-based, no auth)

## Scan & Share Specific
- Unique QR tokens for clinics (64-char hex)
- Visit status validation
- Doctor clinic ownership verification
- Socket.io room-based security (clinic-specific)

---

# 📱 Frontend Routing

## MedSecure Routes
- `/login` - Authentication
- `/doctor` - Doctor dashboard (protected)
- `/pharmacy` - Pharmacist portal (protected)
- `/prescription/:hash` - Public patient view

## Scan & Share Routes
- `/login` - Authentication
- `/patient/dashboard` - Patient check-in (protected)
- `/patient/health-locker` - Prescription history (protected)
- `/doctor/dashboard` - Clinic management (protected)
- `/doctor/waiting-room/:clinicId` - Waiting room (protected)
- `/doctor/prescription/:visitId` - Prescription form (protected)

---

# 🗄️ Database Schema Summary

## MedSecure Collections

### users
- id (ObjectId)
- username (String, unique)
- email (String, unique)
- hashed_password (String)
- role (Enum: doctor, pharmacist)
- full_name (String)
- created_at (String)

### prescriptions
- id (ObjectId)
- hash (String, unique) - SHA-256
- patient_name (String)
- doctor_id (String) - References users._id
- medications (Array)
- status (Enum: ACTIVE, REDEEMED, EXPIRED)
- issued_at (String)
- redeemed_at (String, nullable)
- redeemed_by (String, nullable) - References users._id
- expires_at (String, nullable)

### auditlogs
- id (ObjectId)
- prescription_id (String) - References prescriptions._id
- user_id (String) - References users._id
- action (String)
- previous_status (String, nullable)
- new_status (String, nullable)
- timestamp (String)
- details (Object, nullable)

## Scan & Share Collections

### users
- _id (ObjectId)
- name (String)
- email (String, unique)
- password (String - hashed)
- role (Enum: patient, doctor, admin)
- phone (String, optional)
- dateOfBirth (Date, optional)
- createdAt (Date)

### clinics
- _id (ObjectId)
- name (String)
- location (String)
- uniqueQrToken (String, unique, 64-char hex)
- doctorId (ObjectId) - References users._id
- isActive (Boolean)
- createdAt (Date)

### visits
- _id (ObjectId)
- clinicId (ObjectId) - References clinics._id
- patientId (ObjectId) - References users._id
- status (Enum: Waiting, In-Progress, Completed, Cancelled)
- checkInTime (Date)
- startTime (Date, nullable)
- endTime (Date, nullable)
- notes (String, optional)

### prescriptions
- _id (ObjectId)
- visitId (ObjectId) - References visits._id
- patientId (ObjectId) - References users._id
- doctorId (ObjectId) - References users._id
- medications (Array)
  - { name, dosage, frequency, duration, instructions }
- hashId (String, unique) - SHA-256 hash
- issuedAt (Date)
- notes (String, optional)

---

# 🚀 Running the Projects

## MedSecure

### Backend
```bash
cd backend-express
npm install
# Create .env file
npm run dev  # Port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev  # Port 5173
```

## Scan & Share

### Backend
```bash
cd scan-share-backend
npm install
# Create .env file
npm run dev  # Port 8001
```

### Frontend
```bash
cd scan-share-frontend
npm install
npm run dev  # Port 5174
```

---

# 📚 Additional Documentation Files

- `README.md` - Main project documentation
- `EXPRESS_SETUP.md` - Express.js setup guide
- `MONGODB_SETUP.md` - MongoDB Atlas setup
- `VSCODE_SETUP.md` - VS Code setup instructions
- `SCAN_SHARE_SETUP.md` - Scan & Share specific setup
- `QUICK_START.md` - Quick start commands
- `MOBILE_ACCESS_SETUP.md` - Mobile/tunnel access guide

---

# 🎯 Key Design Decisions

## Why Express.js instead of FastAPI?
- Single language stack (JavaScript/Node.js)
- Better integration with React frontend
- Large npm ecosystem
- Easier deployment options
- Better real-time support (Socket.io)

## Why MongoDB Atlas?
- NoSQL flexibility for nested medication arrays
- Cloud-hosted (no local installation)
- Automatic scaling
- Free tier available
- Easy to use with Mongoose

## Why Socket.io?
- Real-time waiting room updates
- Reduces server polling load
- Event-based architecture
- Fallback to polling if WebSocket unavailable

## Why SHA-256 Hashing?
- Ensures prescription integrity
- Prevents tampering
- Unique identifier for each prescription
- Can be verified independently

---

# 🔍 File Usage Matrix

## MedSecure Files Usage

| File | Used By | Purpose |
|------|---------|---------|
| `backend-express/server.js` | Node.js runtime | Entry point, route mounting |
| `backend-express/models/User.js` | `routes/auth.js`, `middleware/auth.js` | User authentication |
| `backend-express/models/Prescription.js` | `routes/prescription.js` | Prescription CRUD |
| `backend-express/models/AuditLog.js` | `routes/prescription.js` | Audit trail logging |
| `backend-express/routes/auth.js` | `server.js` | Authentication endpoints |
| `backend-express/routes/prescription.js` | `server.js` | Prescription endpoints |
| `backend-express/middleware/auth.js` | All protected routes | JWT verification |
| `backend-express/utils/security.js` | `routes/auth.js`, `routes/prescription.js` | Password/JWT/hash functions |
| `frontend/src/services/api.js` | All frontend pages | API communication |
| `frontend/src/contexts/AuthContext.jsx` | `App.jsx`, all pages | Auth state management |
| `frontend/src/components/QRScanner.jsx` | `PharmacyPortal.jsx` | QR code scanning |
| `frontend/src/components/PrescriptionQR.jsx` | `DoctorDashboard.jsx`, `PatientView.jsx` | QR code display |
| `frontend/src/pages/DoctorDashboard.jsx` | `App.jsx` | Doctor interface |
| `frontend/src/pages/PharmacyPortal.jsx` | `App.jsx` | Pharmacist interface |
| `frontend/src/pages/PatientView.jsx` | `App.jsx` | Public patient view |

## Scan & Share Files Usage

| File | Used By | Purpose |
|------|---------|---------|
| `scan-share-backend/server.js` | Node.js runtime | Entry point, Socket.io setup |
| `scan-share-backend/models/User.js` | All auth routes | User management |
| `scan-share-backend/models/Clinic.js` | `controllers/clinicController.js` | Clinic data |
| `scan-share-backend/models/Visit.js` | `controllers/visitController.js` | Visit lifecycle |
| `scan-share-backend/models/Prescription.js` | `controllers/prescriptionController.js` | Prescription data |
| `scan-share-backend/controllers/clinicController.js` | `routes/clinics.js` | Clinic business logic |
| `scan-share-backend/controllers/visitController.js` | `routes/visits.js` | Visit business logic |
| `scan-share-backend/controllers/prescriptionController.js` | `routes/prescriptions.js` | Prescription business logic |
| `scan-share-backend/routes/clinics.js` | `server.js` | Clinic endpoints |
| `scan-share-backend/routes/visits.js` | `server.js` | Visit endpoints |
| `scan-share-backend/routes/prescriptions.js` | `server.js` | Prescription endpoints |
| `scan-share-frontend/src/pages/WaitingRoom.jsx` | `App.jsx` | Real-time waiting room |
| `scan-share-frontend/src/pages/PrescriptionForm.jsx` | `App.jsx` | Prescription issuance form |
| `scan-share-frontend/src/pages/HealthLocker.jsx` | `App.jsx` | Patient prescription history |

---

This documentation provides a complete reference for understanding the structure, purpose, and usage of every file in both projects.

