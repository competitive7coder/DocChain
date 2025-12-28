import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { visitAPI, prescriptionAPI } from '../services/api';
import { io } from 'socket.io-client';

const WaitingRoom = () => {
  const { clinicId } = useParams();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [waitingPatients, setWaitingPatients] = useState([]);
  const [clinic, setClinic] = useState(null);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchWaitingRoom();

    const socket = io('http://localhost:8001');
    
    socket.on('connect', () => {
      console.log('Connected to server');
      socket.emit('join-clinic', clinicId);
    });

    socket.on('patient-checked-in', () => {
      fetchWaitingRoom(); 
    });

    socket.on('visit-updated', () => {
      fetchWaitingRoom(); 
    });

    const interval = setInterval(() => {
      fetchWaitingRoom();
    }, 30000);

    return () => {
      socket.disconnect();
      clearInterval(interval);
    };
  }, [clinicId]);

  const fetchWaitingRoom = async () => {
    try {
      setError('');
      const data = await visitAPI.getWaitingRoom(clinicId);
      setClinic(data.clinic);
      setWaitingPatients(data.waitingPatients);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load waiting room');
    } finally {
      setLoading(false);
    }
  };

  const handleStartVisit = async (visitId) => {
    try {
      await visitAPI.startVisit(visitId);
      navigate(`/doctor/prescription/${visitId}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to start visit');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-indigo-700">Scan & Share</h1>
            <p className="text-sm text-gray-600">Waiting Room - {clinic?.name}</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-700">Dr. {user?.name}</span>
            <button
              onClick={logout}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg p-6"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              Waiting Room
            </h2>
            <button
              onClick={fetchWaitingRoom}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              🔄 Refresh
            </button>
          </div>

          {clinic && (
            <div className="mb-6 p-4 bg-indigo-50 rounded-lg">
              <p className="font-semibold text-indigo-800">{clinic.name}</p>
              <p className="text-sm text-indigo-600">{clinic.location}</p>
            </div>
          )}

          {waitingPatients.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🪑</div>
              <p className="text-xl text-gray-600">No patients waiting</p>
              <p className="text-gray-500 mt-2">
                Patients will appear here when they check in
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {waitingPatients.map((item, index) => (
                <motion.div
                  key={item.visitId}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-800">
                        {item.patient.name}
                      </h3>
                      <div className="mt-2 space-y-1 text-sm text-gray-600">
                        {item.patient.email && (
                          <p>📧 {item.patient.email}</p>
                        )}
                        {item.patient.phone && (
                          <p>📱 {item.patient.phone}</p>
                        )}
                        <p>
                          ⏱️ Checked in {item.waitTime} minute{item.waitTime !== 1 ? 's' : ''} ago
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(item.checkInTime).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleStartVisit(item.visitId)}
                      className="ml-4 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                    >
                      Start Visit
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default WaitingRoom;

