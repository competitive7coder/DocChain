import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { clinicAPI, visitAPI } from '../services/api';
import { QRCodeSVG } from 'qrcode.react';
import { io } from 'socket.io-client';

const DoctorDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [clinics, setClinics] = useState([]);
  const [waitingCounts, setWaitingCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newClinic, setNewClinic] = useState({ name: '', location: '' });
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    fetchClinics();
  }, []);

  useEffect(() => {
    if (clinics.length === 0) return;
    const socket = io('http://localhost:8000');
    
    socket.on('connect', () => {
      clinics.forEach(clinic => {
        socket.emit('join-clinic', clinic.id || clinic._id);
        updateSingleClinicCount(clinic.id || clinic._id);
      });
    });

    socket.on('patient-checked-in', (data) => {
      updateSingleClinicCount(data.clinicId);
    });

    return () => socket.disconnect();
  }, [clinics]);

  const fetchClinics = async () => {
    try {
      setError('');
      const data = await clinicAPI.getMyClinics();
      setClinics(data.clinics);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load clinics');
    } finally {
      setLoading(false);
    }
  };

  const updateSingleClinicCount = async (clinicId) => {
    try {
      const data = await visitAPI.getWaitingRoom(clinicId);
      setWaitingCounts(prev => ({
        ...prev,
        [clinicId]: data.waitingPatients.length
      }));
    } catch (err) {
      console.error('Count update failed:', err);
    }
  };

  const handleCreateClinic = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await clinicAPI.createClinic(newClinic);
      setNewClinic({ name: '', location: '' });
      setShowCreateForm(false);
      fetchClinics();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create clinic');
    }
  };

  const handleDeleteClinic = async (clinicId) => {
    if (window.confirm('Are you sure you want to delete this clinic? All associated data will be removed.')) {
      try {
        await clinicAPI.deleteClinic(clinicId);
        fetchClinics(); 
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to delete clinic');
      }
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
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-indigo-700">Scan & Share</h1>
            <p className="text-sm text-gray-500 font-medium">Doctor Command Center</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-gray-800">Dr. {user?.name}</p>
              <p className="text-xs text-green-600">● Online</p>
            </div>
            <button
              onClick={logout}
              className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-colors font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Active Clinics</h2>
            <p className="text-gray-600">Manage your clinics and monitor live waiting rooms</p>
          </div>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-md transition-all font-semibold"
          >
            {showCreateForm ? 'Cancel Creation' : '+ Add New Clinic'}
          </button>
        </div>

        {showCreateForm && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-indigo-100"
          >
            <h3 className="text-lg font-bold text-gray-800 mb-6">Clinic Details</h3>
            <form onSubmit={handleCreateClinic} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Clinic Name</label>
                <input
                  type="text"
                  placeholder="e.g. City General Hospital"
                  value={newClinic.name}
                  onChange={(e) => setNewClinic({ ...newClinic, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Location</label>
                <input
                  type="text"
                  placeholder="e.g. Floor 4, Wing B"
                  value={newClinic.location}
                  onChange={(e) => setNewClinic({ ...newClinic, location: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <button
                  type="submit"
                  className="w-full sm:w-max px-8 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-bold"
                >
                  Confirm & Create
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {clinics.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-16 text-center border-2 border-dashed border-gray-200">
            <div className="text-6xl mb-4">🏥</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Setup Required</h3>
            <p className="text-gray-500 max-w-sm mx-auto">
              You haven't registered any clinics yet. Create one to begin generating patient QR codes.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {clinics.map((clinic) => (
              <motion.div
                key={clinic.id || clinic._id}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow p-6 border border-gray-100 flex flex-col lg:flex-row gap-8 items-center"
              >
                <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 text-center w-full lg:w-auto">
                  <QRCodeSVG value={clinic.uniqueQrToken} size={160} level="H" includeMargin={true} />
                  <div className="mt-4">
                    <p className="text-xs font-mono text-gray-400 uppercase tracking-widest">Clinic Token</p>
                    <p className="text-xs font-bold text-gray-700 truncate max-w-[160px] mx-auto">
                      {clinic.uniqueQrToken}
                    </p>
                  </div>
                </div>

                <div className="flex-1 w-full text-center lg:text-left">
                  <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
                    <div>
                      <h3 className="text-2xl font-extrabold text-gray-900">{clinic.name}</h3>
                      <p className="text-indigo-600 font-medium flex items-center justify-center lg:justify-start gap-1 mt-1">
                        📍 {clinic.location}
                      </p>
                    </div>
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100 mx-auto lg:mx-0">
                      <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
                      </span>
                      <span className="font-bold">
                        {waitingCounts[clinic.id || clinic._id] || 0} Patients Waiting
                      </span>
                    </div>
                  </div>

                  <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <button
                      onClick={() => navigate(`/doctor/waiting-room/${clinic.id || clinic._id}`)}
                      className="lg:col-span-2 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-bold shadow-sm transition-all flex items-center justify-center gap-2"
                    >
                      🚪 Enter Waiting Room
                    </button>
                    <button 
                      onClick={() => handleDeleteClinic(clinic.id || clinic._id)}
                      className="px-6 py-3 border border-red-200 text-red-600 rounded-xl hover:bg-red-50 font-bold transition-all flex items-center justify-center gap-2"
                    >
                      🗑️ Delete Clinic
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorDashboard;