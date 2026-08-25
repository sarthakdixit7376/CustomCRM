import { Router } from 'express';
import { getAgentReport, getRenewalReport } from '../controllers/ReportController.js';
import { requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/agents', requireRole('ADMIN'), getAgentReport);
router.get('/renewals', requireRole('ADMIN'), getRenewalReport);

export default router;
