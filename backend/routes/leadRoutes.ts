import { Router } from 'express';
import { getLeads, getLeadById, createLead, deleteLead, updateLeadFlowStatus, updateLeadAgent, updateLeadQuote, generatePricingPdf } from '../controllers/LeadController.js';
import { requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/', getLeads);
router.get('/:id', getLeadById);
router.post('/', createLead);
router.patch('/:id/lead-flow-status', updateLeadFlowStatus);
router.patch('/:id/agent', requireRole('ADMIN'), updateLeadAgent);
router.patch('/:id/quote', updateLeadQuote);
router.post('/:id/pricing-pdf', generatePricingPdf);
router.delete('/:id', deleteLead);

export default router;
