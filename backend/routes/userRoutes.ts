import { Router } from 'express';
import { getUsers, createUser, updateUser, deleteUser } from '../controllers/UserController.js';
import { requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/', requireRole('ADMIN'), getUsers);
router.post('/', requireRole('ADMIN'), createUser);
router.patch('/:id', requireRole('ADMIN'), updateUser);
router.delete('/:id', requireRole('ADMIN'), deleteUser);

export default router;
