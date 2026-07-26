import { Router } from 'express';
import { createInvitation, listInvitations, revokeInvitation } from '../controllers/InvitationController.js';
import { requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/', requireRole('ADMIN'), listInvitations);
router.post('/', requireRole('ADMIN'), createInvitation);
router.delete('/:id', requireRole('ADMIN'), revokeInvitation);

export default router;
