import { Router } from 'express';
import { getAgentReport, getRenewalReport, getProfitReport, getLeadPerformanceReport } from '../controllers/ReportController.js';
import { requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/lead-performance', requireRole('ADMIN'), getLeadPerformanceReport);
router.get('/agents', requireRole('ADMIN'), getAgentReport);
router.get('/renewals', requireRole('ADMIN'), getRenewalReport);
router.get('/profit', requireRole('ADMIN'), getProfitReport);

export default router;
