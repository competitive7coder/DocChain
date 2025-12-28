import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    trim: true, 
    lowercase: true 
  },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['patient', 'doctor', 'admin', 'pharmacy'], 
    default: 'patient' 
  },
  phone: { type: String, trim: true },
  createdAt: { type: Date, default: Date.now }
}, {
  timestamps: false,
  versionKey: false
});

const User = mongoose.model('User', userSchema);
export default User;