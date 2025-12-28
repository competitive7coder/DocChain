import Visit from '../models/Visit.js';
import Clinic from '../models/Clinic.js';
import Prescription from '../models/Prescription.js';

// @desc    Check-in patient via QR Scan
// @route   POST /api/visits/check-in
export const checkIn = async (req, res) => {
  try {
    const { clinicId } = req.body;
    const patientId = req.user._id;

    const clinic = await Clinic.findById(clinicId);
    if (!clinic) {
      return res.status(404).json({ error: 'Clinic not found' });
    }

    //  if patient already has an active visit
    const existingVisit = await Visit.findOne({
      clinicId,
      patientId,
      status: { $in: ['Waiting', 'In-Progress'] }
    });

    if (existingVisit) {
      return res.status(400).json({ 
        error: 'You already have an active visit in this clinic',
        visitId: existingVisit._id
      });
    }

    const visit = await Visit.create({
      clinicId,
      patientId,
      status: 'Waiting',
      checkInTime: new Date()
    });

    await visit.populate('clinicId', 'name location');
    await visit.populate('patientId', 'name email phone');

    const io = req.app.get('io'); 
    if (io) {
      io.to(clinicId.toString()).emit('patient-checked-in', {
        clinicId,
        patientName: visit.patientId.name,
        visitId: visit._id
      });
    }

    res.status(201).json({
      message: 'Check-in successful',
      visit: {
        id: visit._id,
        clinic: visit.clinicId,
        patient: visit.patientId,
        status: visit.status,
        checkInTime: visit.checkInTime
      }
    });
  } catch (error) {
    console.error('Check-in error:', error);
    res.status(500).json({ error: 'Check-in failed' });
  }
};

// @desc    Get live waiting room list for a clinic
// @route   GET /api/visits/waiting-room/:clinicId
export const getWaitingRoom = async (req, res) => {
  try {
    const { clinicId } = req.params;

    const clinic = await Clinic.findById(clinicId);
    if (!clinic) {
      return res.status(404).json({ error: 'Clinic not found' });
    }

    // Security: Only the assigned doctor can view the waiting room
    if (clinic.doctorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const visits = await Visit.find({
      clinicId,
      status: 'Waiting'
    })
    .populate('patientId', 'name email phone')
    .sort({ checkInTime: 1 });

    res.json({
      clinic: {
        id: clinic._id,
        name: clinic.name,
        location: clinic.location
      },
      waitingPatients: visits.map(visit => ({
        visitId: visit._id,
        patient: visit.patientId,
        checkInTime: visit.checkInTime,
        waitTime: Math.floor((new Date() - visit.checkInTime) / 1000 / 60)
      }))
    });
  } catch (error) {
    console.error('Get waiting room error:', error);
    res.status(500).json({ error: 'Failed to get waiting room' });
  }
};

// @desc    Start the medical consultation
// @route   POST /api/visits/start/:visitId
export const startVisit = async (req, res) => {
  try {
    const { visitId } = req.params;

    const visit = await Visit.findById(visitId).populate('clinicId');

    if (!visit) {
      return res.status(404).json({ error: 'Visit not found' });
    }

    if (visit.clinicId.doctorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (visit.status !== 'Waiting') {
      return res.status(400).json({ error: 'Visit is not in waiting status' });
    }

    visit.status = 'In-Progress';
    visit.startTime = new Date();
    await visit.save();

    await visit.populate('patientId', 'name email phone');

    const io = req.app.get('io');
    if (io) {
      io.to(visit.clinicId._id.toString()).emit('visit-updated', {
        visitId: visit._id,
        clinicId: visit.clinicId._id,
        status: 'In-Progress'
      });
    }

    res.json({
      message: 'Visit started',
      visit: {
        id: visit._id,
        patient: visit.patientId,
        status: visit.status,
        startTime: visit.startTime
      }
    });
  } catch (error) {
    console.error('Start visit error:', error);
    res.status(500).json({ error: 'Failed to start visit' });
  }
};

// @desc    Retrieve details for a specific visit
// @route   GET /api/visits/:visitId
export const getVisit = async (req, res) => {
  try {
    const { visitId } = req.params;

    const visit = await Visit.findById(visitId)
      .populate('clinicId', 'name location doctorId')
      .populate('patientId', 'name email phone');

    if (!visit) {
      return res.status(404).json({ error: 'Visit not found' });
    }

    const clinicDoctorId = visit.clinicId.doctorId?.toString() || visit.clinicId.doctorId;
    const isPatient = req.user.role === 'patient' && visit.patientId._id.toString() === req.user._id.toString();
    const isDoctor = req.user.role === 'doctor' && clinicDoctorId === req.user._id.toString();

    if (!isPatient && !isDoctor) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const prescription = await Prescription.findOne({ visitId: visit._id });

    res.json({
      visit: {
        id: visit._id,
        clinic: visit.clinicId,
        patient: visit.patientId,
        status: visit.status,
        checkInTime: visit.checkInTime,
        startTime: visit.startTime,
        endTime: visit.endTime,
        notes: visit.notes
      },
      prescription: prescription || null
    });
  } catch (error) {
    console.error('Get visit error:', error);
    res.status(500).json({ error: 'Failed to get visit' });
  }
};