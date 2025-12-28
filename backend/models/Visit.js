import mongoose from 'mongoose';

const visitSchema = new mongoose.Schema({
  clinicId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Clinic',
    required: true
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['Waiting', 'In-Progress', 'Completed', 'Cancelled'],
    default: 'Waiting',
    required: true
  },
  checkInTime: {
    type: Date,
    default: Date.now
  },
  startTime: {
    type: Date
  },
  endTime: {
    type: Date
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: false,
  versionKey: false
});


visitSchema.index({ clinicId: 1, status: 1 });

visitSchema.index({ patientId: 1 });

const Visit = mongoose.model('Visit', visitSchema);

export default Visit;