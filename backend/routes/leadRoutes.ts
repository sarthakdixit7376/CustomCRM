import { Router } from 'express';
import { getLeads, getLeadById, createLead, deleteLead, updateLeadFlowStatus, updateLeadAgent, updateLeadQuote, autoQuoteLead, getLiveComparisons, generatePricingPdf, convertLeadToCustomer } from '../controllers/LeadController.js';
import { requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/', getLeads);
// Must come before '/:id' — otherwise Express would match "live-comparisons" as a lead id.
router.get('/live-comparisons', getLiveComparisons);
router.get('/:id', getLeadById);
router.post('/', createLead);
router.patch('/:id/lead-flow-status', updateLeadFlowStatus);
router.patch('/:id/agent', requireRole('ADMIN'), updateLeadAgent);
router.patch('/:id/quote', updateLeadQuote);
router.post('/:id/auto-quote', autoQuoteLead);
router.post('/:id/pricing-pdf', generatePricingPdf);
router.post('/:id/convert-to-customer', convertLeadToCustomer);
router.delete('/:id', deleteLead);

export default router;
