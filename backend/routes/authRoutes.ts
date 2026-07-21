import { Router } from 'express';
import { signup, login, logout, me } from '../controllers/AuthController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', authenticate, me);

export default router;
