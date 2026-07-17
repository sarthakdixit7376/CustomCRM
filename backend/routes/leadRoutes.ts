import { Router } from 'express';
import { getLeads, createLead, deleteLead } from '../controllers/LeadController.js';

const router = Router();

router.get('/', getLeads);
router.post('/', createLead);
router.delete('/:id', deleteLead);

export default router;
