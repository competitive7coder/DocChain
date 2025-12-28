import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import * as visitController from '../controllers/visitController.js';

const router = express.Router();

router.post('/check-in', authenticateToken, requireRole('patient'), [
  body('clinicId').notEmpty().withMessage('Clinic ID is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg });
  }
  await visitController.checkIn(req, res);
});

router.get('/waiting-room/:clinicId', authenticateToken, requireRole('doctor'), visitController.getWaitingRoom);

router.post('/start/:visitId', authenticateToken, requireRole('doctor'), visitController.startVisit);

router.get('/:visitId', authenticateToken, visitController.getVisit);

export default router;

