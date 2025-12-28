import Clinic from '../models/Clinic.js';
import Visit from '../models/Visit.js';
import crypto from 'crypto';

// Create clinic
export const createClinic = async (req, res) => {
  try {
    const { name, location } = req.body;
    const doctorId = req.user._id;

    const clinic = await Clinic.create({
      name,
      location,
      doctorId,
      uniqueQrToken: crypto.randomBytes(32).toString('hex')
    });

    res.status(201).json({
      message: 'Clinic created successfully',
      clinic: {
        id: clinic._id,
        name: clinic.name,
        location: clinic.location,
        uniqueQrToken: clinic.uniqueQrToken,
        qrCodeUrl: `${req.protocol}://${req.get('host')}/api/clinics/${clinic.uniqueQrToken}/qr`
      }
    });
  } catch (error) {
    console.error('Create clinic error:', error);
    res.status(500).json({ error: 'Failed to create clinic' });
  }
};

// Get doctor's clinics
export const getMyClinics = async (req, res) => {
  try {
    const doctorId = req.user._id;
    const clinics = await Clinic.find({ doctorId, isActive: true })
      .select('name location uniqueQrToken createdAt');

    res.json({
      clinics: clinics.map(clinic => ({
        id: clinic._id,
        name: clinic.name,
        location: clinic.location,
        uniqueQrToken: clinic.uniqueQrToken
      }))
    });
  } catch (error) {
    console.error('Get my clinics error:', error);
    res.status(500).json({ error: 'Failed to get clinics' });
  }
};

// Get clinic by QR token
export const getClinicByToken = async (req, res) => {
  try {
    const { qrToken } = req.params;
    const clinic = await Clinic.findOne({ uniqueQrToken: qrToken, isActive: true })
      .populate('doctorId', 'name email');

    if (!clinic) {
      return res.status(404).json({ error: 'Clinic not found' });
    }

    res.json({
      clinic: {
        id: clinic._id,
        name: clinic.name,
        location: clinic.location,
        doctor: clinic.doctorId
      }
    });
  } catch (error) {
    console.error('Get clinic by token error:', error);
    res.status(500).json({ error: 'Failed to get clinic' });
  }
};

// Delete clinic
export const deleteClinic = async (req, res) => {
  try {
    const { clinicId } = req.params;
    const clinic = await Clinic.findById(clinicId);

    if (!clinic) {
      return res.status(404).json({ error: 'Clinic not found' });
    }

    if (clinic.doctorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await Clinic.findByIdAndDelete(clinicId);
    await Visit.deleteMany({ clinicId }); 

    res.json({ message: 'Clinic deleted successfully' });
  } catch (error) {
    console.error('Delete clinic error:', error);
    res.status(500).json({ error: 'Server error during deletion' });
  }
};