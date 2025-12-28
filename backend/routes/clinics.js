import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import * as clinicController from '../controllers/clinicController.js';

const router = express.Router();

router.post('/', authenticateToken, requireRole('doctor'), [
  body('name').trim().notEmpty().withMessage('Clinic name is required'),
  body('location').trim().notEmpty().withMessage('Location is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg });
  }
  await clinicController.createClinic(req, res);
});

router.get('/my-clinics', authenticateToken, requireRole('doctor'), clinicController.getMyClinics);

router.get('/qr/:qrToken', clinicController.getClinicByToken);

router.delete('/:clinicId', authenticateToken, requireRole('doctor'), clinicController.deleteClinic);

export default router;