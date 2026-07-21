import { Router } from 'express';
import fieldRoutes from './fieldRoutes.js';
import leadRoutes from './leadRoutes.js';
import customerRoutes from './customerRoutes.js';
import policyRoutes from './policyRoutes.js';
import userRoutes from './userRoutes.js';

const router = Router();

router.use('/fields', fieldRoutes);
router.use('/leads', leadRoutes);
router.use('/customers', customerRoutes);
router.use('/policies', policyRoutes);
router.use('/users', userRoutes);

export default router;
