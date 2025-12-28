import mongoose from 'mongoose';
import crypto from 'crypto';

const clinicSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  location: {
    type: String,
    required: true,
    trim: true
  },
  uniqueQrToken: {
    type: String,
    unique: true, 
    required: true,
    default: () => crypto.randomBytes(32).toString('hex')
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: false,
  versionKey: false
});

clinicSchema.index({ doctorId: 1 });

const Clinic = mongoose.model('Clinic', clinicSchema);

export default Clinic;