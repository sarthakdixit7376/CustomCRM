import { Router } from 'express';
import fieldRoutes from './fieldRoutes.js';
import leadRoutes from './leadRoutes.js';
import customerRoutes from './customerRoutes.js';
import policyRoutes from './policyRoutes.js';

const router = Router();

// Health check
router.get('/health', (req, res) => {
  res.json({ ok: true });
});

router.use('/fields', fieldRoutes);
router.use('/leads', leadRoutes);
router.use('/customers', customerRoutes);
router.use('/policies', policyRoutes);

export default router;
