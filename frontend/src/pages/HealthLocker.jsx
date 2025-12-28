import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { prescriptionAPI } from '../services/api';
import { QRCodeSVG } from 'qrcode.react';

const HealthLocker = () => {
  const { user, logout } = useAuth();
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPrescription, setSelectedPrescription] = useState(null);

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const fetchPrescriptions = async () => {
    try {
      setError('');
      const data = await prescriptionAPI.getMyPrescriptions();
      setPrescriptions(data.prescriptions);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load prescriptions');
    } finally {
      setLoading(false);
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
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-emerald-700">Health Locker</h1>
            <p className="text-sm text-gray-600">Your Prescription History</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-700">Welcome, {user?.name}</span>
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

        {prescriptions.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-lg p-12 text-center"
          >
            <div className="text-6xl mb-4"></div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              No Prescriptions Yet
            </h2>
            <p className="text-gray-600">
              Your prescriptions will appear here after your visit
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {prescriptions.map((prescription) => (
              <motion.div
                key={prescription.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl shadow-lg p-6"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">
                      Dr. {prescription.doctor.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {prescription.clinic.name}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(prescription.issuedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedPrescription(
                      selectedPrescription?.id === prescription.id ? null : prescription
                    )}
                    className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded text-sm hover:bg-indigo-200"
                  >
                    {selectedPrescription?.id === prescription.id ? 'Hide QR' : 'Show QR'}
                  </button>
                </div>

                <div className="mb-4">
                  <h4 className="font-medium text-gray-700 mb-2">Medications:</h4>
                  <ul className="space-y-2">
                    {prescription.medications.map((med, index) => (
                      <li key={index} className="text-sm text-gray-600 pl-4 border-l-2 border-indigo-200">
                        <span className="font-medium">{med.name}</span> - {med.dosage}
                        <br />
                        <span className="text-xs text-gray-500">
                          {med.frequency} for {med.duration}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {prescription.notes && (
                  <div className="mb-4 p-3 bg-gray-50 rounded">
                    <p className="text-sm text-gray-700">{prescription.notes}</p>
                  </div>
                )}

                {selectedPrescription?.id === prescription.id && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mt-4 p-4 bg-gray-50 rounded-lg text-center"
                  >
                    <p className="text-sm text-gray-600 mb-2">Prescription QR Code</p>
                    <div className="flex justify-center">
                      <QRCodeSVG value={prescription.hashId} size={200} level="H" />
                    </div>
                    <p className="text-xs text-gray-500 mt-2 break-all">
                      Hash: {prescription.hashId}
                    </p>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HealthLocker;

