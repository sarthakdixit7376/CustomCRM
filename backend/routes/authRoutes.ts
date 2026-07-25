import { Router } from 'express';
import { login, logout, me, getInvitation, acceptInvitation } from '../controllers/AuthController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.post('/login', login);
router.post('/logout', logout);
router.get('/me', authenticate, me);
router.get('/invite/:token', getInvitation);
router.post('/invite/:token/accept', acceptInvitation);

export default router;
