import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { visitAPI, prescriptionAPI } from '../services/api';

const PrescriptionForm = () => {
  const { visitId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [visit, setVisit] = useState(null);
  const [medications, setMedications] = useState([
    { name: '', dosage: '', frequency: '', duration: '', instructions: '' }
  ]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchVisitDetails();
  }, [visitId]);

  const fetchVisitDetails = async () => {
    try {
      const data = await visitAPI.getVisit(visitId);
      setVisit(data.visit);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load visit details');
    }
  };

  const addMedication = () => {
    setMedications([
      ...medications,
      { name: '', dosage: '', frequency: '', duration: '', instructions: '' }
    ]);
  };

  const removeMedication = (index) => {
    setMedications(medications.filter((_, i) => i !== index));
  };

  const updateMedication = (index, field, value) => {
    const updated = [...medications];
    updated[index][field] = value;
    setMedications(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    const validMedications = medications.filter(
      (med) => med.name && med.dosage && med.frequency && med.duration
    );

    if (validMedications.length === 0) {
      setError('At least one medication is required');
      return;
    }

    setLoading(true);

    try {
      const result = await prescriptionAPI.issuePrescription({
        visitId,
        medications: validMedications,
        notes
      });

      setSuccess(true);
      setTimeout(() => {
        navigate(`/doctor/waiting-room/${visit.clinic._id || visit.clinic}`);
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to issue prescription');
    } finally {
      setLoading(false);
    }
  };

  if (!visit) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg p-8"
        >
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            Issue Prescription
          </h2>

          <div className="bg-indigo-50 p-4 rounded-lg mb-6">
            <h3 className="font-semibold text-indigo-800 mb-2">Patient Information</h3>
            <p className="text-gray-700">Name: {visit.patient.name}</p>
            {visit.patient.email && (
              <p className="text-gray-700">Email: {visit.patient.email}</p>
            )}
            {visit.patient.phone && (
              <p className="text-gray-700">Phone: {visit.patient.phone}</p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <div className="flex justify-between items-center mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Medications *
                </label>
                <button
                  type="button"
                  onClick={addMedication}
                  className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  + Add Medication
                </button>
              </div>

              {medications.map((med, index) => (
                <div key={index} className="mb-4 p-4 border border-gray-200 rounded-lg space-y-2">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      Medication {index + 1}
                    </span>
                    {medications.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeMedication(index)}
                        className="text-red-600 hover:text-red-700 text-sm"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <input
                    type="text"
                    placeholder="Medication Name *"
                    value={med.name}
                    onChange={(e) => updateMedication(index, 'name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Dosage *"
                    value={med.dosage}
                    onChange={(e) => updateMedication(index, 'dosage', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Frequency *"
                    value={med.frequency}
                    onChange={(e) => updateMedication(index, 'frequency', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Duration *"
                    value={med.duration}
                    onChange={(e) => updateMedication(index, 'duration', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Instructions (optional)"
                    value={med.instructions}
                    onChange={(e) => updateMedication(index, 'instructions', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              ))}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="Add any additional notes or instructions..."
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                Prescription issued successfully! Redirecting...
              </div>
            )}

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium disabled:opacity-50"
              >
                {loading ? 'Issuing...' : 'Issue Prescription'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default PrescriptionForm;

