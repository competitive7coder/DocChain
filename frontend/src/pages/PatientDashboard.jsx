import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { visitAPI, clinicAPI, prescriptionAPI } from '../services/api'; 
import QRScanner from '../components/QRScanner';
import { QRCodeSVG } from 'qrcode.react';

const PatientDashboard = () => {
  const { user, logout } = useAuth();
  
  const [showScanner, setShowScanner] = useState(false);
  const [checkInStatus, setCheckInStatus] = useState(null);
  const [prescriptions, setPrescriptions] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setFetchLoading(true);
    try {
      const data = await prescriptionAPI.getPatientPrescriptions();
      setPrescriptions(data.prescriptions || []);
    } catch (err) {
      console.error('Data fetch error:', err);
      setError('Could not load health records.');
    } finally {
      setFetchLoading(false);
    }
  };

  const handleQRScan = async (qrData) => {
    setError('');
    setLoading(true);
    try {
      const clinicResponse = await clinicAPI.getClinicByToken(qrData);
      const clinicId = clinicResponse.clinic.id || clinicResponse.clinic._id;
      const result = await visitAPI.checkIn(clinicId);
      
      setCheckInStatus(result);
      setShowScanner(false);
      
      loadDashboardData(); 
    } catch (err) {
      console.error('Scan error:', err);
      setError(err.response?.data?.error || 'Check-in failed. Please try again.');
      setShowScanner(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">S</div>
            <h1 className="text-lg font-bold text-indigo-700">Scan & Share</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">Hi, {user?.name}</span>
            <button onClick={logout} className="px-3 py-1.5 text-xs text-red-600 bg-red-50 rounded-md hover:bg-red-100 transition-colors">
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <section className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 text-center">
          <h2 className="text-xl font-bold mb-4">Clinic Check-in</h2>
          {!checkInStatus && !showScanner && (
            <button onClick={() => setShowScanner(true)} className="w-full max-w-sm bg-indigo-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-indigo-100">
              📷 Start Scanning
            </button>
          )}

          {showScanner && (
            <div className="max-w-sm mx-auto space-y-4">
              <div className="rounded-2xl overflow-hidden border-4 border-indigo-50 shadow-inner">
                <QRScanner onScanSuccess={handleQRScan} />
              </div>
              <button onClick={() => setShowScanner(false)} className="text-slate-400 font-bold text-sm">Cancel</button>
            </div>
          )}

          {checkInStatus && (
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-emerald-50 border border-emerald-100 p-6 rounded-2xl">
              <div className="text-3xl mb-2">✅</div>
              <h3 className="font-bold text-emerald-900 text-lg">Check-in Confirmed</h3>
              <p className="text-sm text-emerald-700 mt-1">You are now in queue for {checkInStatus.visit?.clinic?.name || 'the clinic'}.</p>
              <button onClick={() => setCheckInStatus(null)} className="mt-4 text-xs font-bold text-emerald-600 uppercase">New Scan</button>
            </motion.div>
          )}
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">My Digital Prescriptions</h2>
            <button onClick={loadDashboardData} className="text-indigo-600 text-sm font-bold hover:underline">Refresh</button>
          </div>

          {fetchLoading ? (
            <div className="text-center py-12 text-slate-400 font-medium">Loading your records...</div>
          ) : prescriptions.length === 0 ? (
            <div className="bg-slate-100 border-2 border-dashed rounded-3xl p-12 text-center text-slate-400">
              No prescriptions found in your locker.
            </div>
          ) : (
            <div className="grid gap-4">
              {prescriptions.map((pres) => (
                <div key={pres.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center gap-6">
                  
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex-shrink-0">
                    <QRCodeSVG value={pres.hashId} size={110} level="H" />
                    <p className="text-[9px] text-center font-black text-indigo-500 mt-2 tracking-tighter">PHARMACY KEY</p>
                  </div>

                  <div className="flex-1 text-center sm:text-left">
                    <h3 className="text-lg font-bold text-slate-900">
                      Dr. {pres.doctor?.name || 'Doctor Name Unavailable'}
                    </h3>
                    <p className="text-xs font-bold text-indigo-600 mb-3">
                      {pres.clinic?.name || 'Clinic Information N/A'} • {new Date(pres.issuedAt).toLocaleDateString()}
                    </p>
                    
                    <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                      {pres.medications?.map((m, i) => (
                        <span key={i} className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-bold border border-slate-200">
                          {m.name} {m.dosage}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default PatientDashboard;