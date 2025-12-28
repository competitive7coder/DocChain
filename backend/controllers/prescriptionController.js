import Prescription from '../models/Prescription.js';
import Visit from '../models/Visit.js';
import Clinic from '../models/Clinic.js';
import crypto from 'crypto';

// @desc    Issue a prescription (Doctor only)
// @route   POST /api/prescriptions/issue
export const issuePrescription = async (req, res) => {
  try {
    const { visitId, medications, notes } = req.body;
    const doctorId = req.user._id;

    const visit = await Visit.findById(visitId).populate('clinicId');

    if (!visit) {
      return res.status(404).json({ error: 'Visit not found' });
    }

    if (visit.clinicId.doctorId.toString() !== doctorId.toString()) {
      return res.status(403).json({ error: 'Access denied: You do not own this clinic' });
    }

    if (visit.status === 'Completed') {
      return res.status(400).json({ error: 'Prescription already issued for this visit' });
    }

    const hashData = `${visitId}-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const generatedHash = crypto.createHash('sha256').update(hashData).digest('hex');

    const prescription = await Prescription.create({
      visitId,
      patientId: visit.patientId,
      doctorId,
      clinicId: visit.clinicId._id, 
      medications,
      notes,
      hashId: generatedHash,
      status: 'Active' // Explicitly set initial status
    });

    visit.status = 'Completed';
    visit.endTime = new Date();
    await visit.save();

    const io = req.app.get('io');
    if (io) {
      io.to(visit.clinicId._id.toString()).emit('visit-updated', {
        clinicId: visit.clinicId._id,
        status: 'Completed'
      });
    }

    await prescription.populate('patientId', 'name email');
    await prescription.populate('doctorId', 'name email');

    res.status(201).json({
      message: 'Prescription issued successfully',
      prescription: {
        id: prescription._id,
        hashId: prescription.hashId,
        visitId: prescription.visitId,
        patient: prescription.patientId,
        doctor: prescription.doctorId,
        medications: prescription.medications,
        notes: prescription.notes,
        issuedAt: prescription.issuedAt,
        status: prescription.status
      }
    });
  } catch (error) {
    console.error('Issue prescription error:', error);
    res.status(500).json({ error: 'Server Error: ' + error.message });
  }
};

// @desc    Get all prescriptions for the logged-in patient 
// @route   GET /api/prescriptions/my-prescriptions
export const getPatientPrescriptions = async (req, res) => {
  try {
    const patientId = req.user._id;

    const prescriptions = await Prescription.find({ patientId })
      .populate('doctorId', 'name email')
      .populate('clinicId', 'name location') 
      .sort({ issuedAt: -1 });

    res.json({
      prescriptions: prescriptions.map(p => ({
        id: p._id,
        hashId: p.hashId,
        doctor: p.doctorId,
        clinic: p.clinicId,
        medications: p.medications,
        notes: p.notes,
        issuedAt: p.issuedAt,
        status: p.status
      }))
    });
  } catch (error) {
    console.error('Get patient prescriptions error:', error);
    res.status(500).json({ error: 'Failed to load health locker' });
  }
};

// @desc    Get a specific prescription by its hashId (Pharmacist Verify)
// @route   GET /api/prescriptions/hash/:hashId
export const getPrescriptionByHash = async (req, res) => {
  try {
    const { hashId } = req.params;
    const prescription = await Prescription.findOne({ hashId })
      .populate('patientId', 'name')   
      .populate('doctorId', 'name')   
      .populate('clinicId', 'name');   

    if (!prescription) return res.status(404).json({ error: 'Invalid QR' });

    // FIX: Check if already dispensed
    if (prescription.status === 'Dispensed') {
      return res.status(400).json({ 
        error: 'This prescription has already been dispensed',
        dispensedAt: prescription.dispensedAt 
      });
    }
    
    res.json({ prescription });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}; // Added missing closing brace here

// @desc    Mark prescription as dispensed (Pharmacist Collect)
// @route   POST /api/prescriptions/redeem/:hashId
export const redeemPrescription = async (req, res) => {
  try {
    const { hashId } = req.params;
    const prescription = await Prescription.findOne({ hashId });

    if (!prescription) return res.status(404).json({ error: 'Prescription not found' });

    // Prevent re-redeeming
    if (prescription.status === 'Dispensed') {
      return res.status(400).json({ error: 'This prescription has already been dispensed' });
    }

    prescription.status = 'Dispensed';
    prescription.dispensedAt = new Date();
    await prescription.save();

    res.json({ message: 'Prescription successfully marked as dispensed', prescription });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};