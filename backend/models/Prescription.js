import mongoose from 'mongoose';
import crypto from 'crypto';

const prescriptionSchema = new mongoose.Schema({
  visitId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Visit',
    required: true,
  },
  clinicId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Clinic',
    required: true,
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  medications: [{
    name: { type: String, required: true },
    dosage: { type: String, required: true },
    frequency: { type: String, required: true },
    duration: { type: String, required: true },
    instructions: { type: String }
  }],
  status: {
    type: String,
    enum: ['Active', 'Dispensed'],
    default: 'Active'
  },
  dispensedAt: { type: Date },
  hashId: {
    type: String,
    unique: true,
    required: true,
    default: () => crypto.createHash('sha256')
      .update(Date.now().toString() + Math.random().toString())
      .digest('hex')
  },
  issuedAt: {
    type: Date,
    default: Date.now
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: false,
  versionKey: false
});

prescriptionSchema.index({ patientId: 1 });
prescriptionSchema.index({ doctorId: 1 });
prescriptionSchema.index({ visitId: 1 });
prescriptionSchema.index({ clinicId: 1 }); 

const Prescription = mongoose.model('Prescription', prescriptionSchema);
export default Prescription;