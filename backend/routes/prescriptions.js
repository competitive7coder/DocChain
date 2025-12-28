import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import * as prescriptionController from '../controllers/prescriptionController.js';

const router = express.Router();

// Issue prescription (doctor only)
router.post('/issue', authenticateToken, requireRole('doctor'), [
  body('visitId').notEmpty().withMessage('Visit ID is required'),
  body('medications').isArray({ min: 1 }).withMessage('At least one medication is required'),
  body('medications.*.name').notEmpty().withMessage('Medication name is required'),
  body('medications.*.dosage').notEmpty().withMessage('Dosage is required'),
  body('medications.*.frequency').notEmpty().withMessage('Frequency is required'),
  body('medications.*.duration').notEmpty().withMessage('Duration is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg });
  }
  await prescriptionController.issuePrescription(req, res);
});

router.get('/my-prescriptions', authenticateToken, requireRole('patient'), prescriptionController.getPatientPrescriptions);

router.get('/hash/:hashId', prescriptionController.getPrescriptionByHash);

router.post('/redeem/:hashId', authenticateToken, requireRole('pharmacy'), prescriptionController.redeemPrescription);

export default router;

