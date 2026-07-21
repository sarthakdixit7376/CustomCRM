import { Router } from 'express';
import { getUsers, createUser, updateUser } from '../controllers/UserController.js';
import { requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/', requireRole('ADMIN'), getUsers);
router.post('/', requireRole('ADMIN'), createUser);
router.patch('/:id', requireRole('ADMIN'), updateUser);

export default router;
