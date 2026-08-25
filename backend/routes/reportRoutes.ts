import { Router } from 'express';
import { getAgentReport } from '../controllers/ReportController.js';
import { requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/agents', requireRole('ADMIN'), getAgentReport);

export default router;
