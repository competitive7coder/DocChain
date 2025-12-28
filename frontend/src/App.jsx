import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Login from './pages/Login';
import PatientDashboard from './pages/PatientDashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import WaitingRoom from './pages/WaitingRoom';
import PrescriptionForm from './pages/PrescriptionForm';
import HealthLocker from './pages/HealthLocker';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route
            path="/patient/dashboard"
            element={
              <ProtectedRoute requiredRole="patient">
                <PatientDashboard />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/doctor/dashboard"
            element={
              <ProtectedRoute requiredRole="doctor">
                <DoctorDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor/waiting-room/:clinicId"
            element={
              <ProtectedRoute requiredRole="doctor">
                <WaitingRoom />
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor/prescription/:visitId"
            element={
              <ProtectedRoute requiredRole="doctor">
                <PrescriptionForm />
              </ProtectedRoute>
            }
          />
          
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;