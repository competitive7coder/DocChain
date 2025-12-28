import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import connectDB from './config/database.js';
import authRoutes from './routes/auth.js';
import visitRoutes from './routes/visits.js';
import prescriptionRoutes from './routes/prescriptions.js';
import clinicRoutes from './routes/clinics.js';

dotenv.config();
const app = express();
const httpServer = createServer(app);

// Socket.io Configuration
const io = new Server(httpServer, {
  cors: {
    origin: '*', // For development
    credentials: true
  }
});

app.use(cors());
app.use(express.json());

// Socket.io Room Logic
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  socket.on('join-clinic', (clinicId) => {
    // We use the raw ID to match the visitController emit
    socket.join(clinicId.toString());
    console.log(`Socket joined room: ${clinicId}`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

app.set('io', io); // Important for visitController

// Route Definitions
app.use('/api/auth', authRoutes);
app.use('/api/visits', visitRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/clinics', clinicRoutes);

// Error Handling
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));

connectDB().then(() => {
  httpServer.listen(8000, () => console.log('Server running on port 8000'));
});