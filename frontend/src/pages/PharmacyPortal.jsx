import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { prescriptionAPI } from '../services/api';
import QRScanner from '../components/QRScanner';

const PharmacyPortal = () => {
  const { user, logout } = useAuth();
  const [scannedHash, setScannedHash] = useState('');
  const [prescription, setPrescription] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [redeemed, setRedeemed] = useState(false);

  const handleScanSuccess = async (decodedText) => {
    setScannedHash(decodedText);
    setError('');
    setPrescription(null);
    setRedeemed(false);
    await verifyPrescription(decodedText);
  };

  const verifyPrescription = async (hash) => {
    setLoading(true);
    setError('');

    try {
      const data = await prescriptionAPI.getPrescriptionByHash(hash);
      setPrescription(data.prescription);
      // If the backend returns it but status is already Dispensed, handleRedeem logic won't show
      if (data.prescription.status === 'Dispensed') {
        setRedeemed(true);
      }
      setShowScanner(false);
    } catch (err) {
      setError(
        err.response?.data?.error || 'Prescription not found or invalid QR'
      );
      setPrescription(null);
      setShowScanner(false);
    } finally {
      setLoading(false);
    }
  };

  const handleRedeem = async () => {
    setLoading(true);
    setError('');

    try {
      // CONNECTED TO BACKEND: This actually changes status to 'Dispensed' in DB
      await prescriptionAPI.redeemPrescription(prescription.hashId); 
      setRedeemed(true);
      // Update local state to reflect the change
      setPrescription(prev => ({ ...prev, status: 'Dispensed' }));
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to redeem prescription');
    } finally {
      setLoading(false);
    }
  };

  const handleManualVerify = async () => {
    if (!scannedHash.trim()) {
      setError('Please enter or scan a prescription hash');
      return;
    }
    await verifyPrescription(scannedHash);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-indigo-700">Scan & Share</h1>
            <p className="text-sm text-gray-600">Pharmacy Portal</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-700">Welcome, {user?.name}</span>
            <button onClick={logout} className="px-4 py-2 bg-red-600 text-white rounded-lg">Logout</button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold mb-6">Verify & Redeem Prescription</h2>

          <div className="mb-6">
            <button
              onClick={() => { setShowScanner(!showScanner); setError(''); setPrescription(null); }}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium mb-4"
            >
              {showScanner ? 'Hide QR Scanner' : 'Open QR Scanner'}
            </button>

            {showScanner && <div className="mb-4"><QRScanner onScanSuccess={handleScanSuccess} /></div>}

            <div className="flex gap-2">
              <input
                type="text"
                value={scannedHash}
                onChange={(e) => setScannedHash(e.target.value)}
                placeholder="Enter hash manually"
                className="flex-1 px-4 py-2 border rounded-lg"
              />
              <button onClick={handleManualVerify} disabled={loading} className="px-6 py-2 bg-indigo-600 text-white rounded-lg disabled:opacity-50">Verify</button>
            </div>
          </div>

          {loading && <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>}
          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">{error}</div>}

          {prescription && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="border rounded-lg p-6 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-semibold">Prescription Details</h3>
                  <p className="text-xs font-mono text-gray-500">{prescription.hashId}</p>
                </div>
                {/* DYNAMIC BADGE */}
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  prescription.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {prescription.status === 'Active' ? 'Valid' : 'ALREADY USED'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div><p className="text-xs text-gray-500">Patient</p><p className="font-medium">{prescription.patientId?.name || 'Unknown'}</p></div>
                <div><p className="text-xs text-gray-500">Doctor</p><p className="font-medium">Dr. {prescription.doctorId?.name || 'Unknown'}</p></div>
              </div>

              <div className="pt-4 border-t">
                <h4 className="font-semibold mb-3">Medications</h4>
                <div className="space-y-2">
                  {prescription.medications.map((med, i) => (
                    <div key={i} className="bg-gray-50 p-3 rounded border">
                      <p className="font-bold">{med.name}</p>
                      <p className="text-sm text-gray-600">{med.dosage} - {med.frequency} for {med.duration}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* ONLY SHOW BUTTON IF NOT REDEEMED */}
              {prescription.status === 'Active' && !redeemed ? (
                <div className="pt-4 border-t">
                  <button
                    onClick={handleRedeem}
                    disabled={loading}
                    className="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 transition-colors"
                  >
                    Mark as Dispensed (Redeem)
                  </button>
                </div>
              ) : (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-center font-bold">
                  THIS PRESCRIPTION HAS BEEN DISPENSED
                </div>
              )}
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default PharmacyPortal;