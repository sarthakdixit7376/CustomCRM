import { Router } from 'express';
import fieldRoutes from './fieldRoutes.js';
import leadRoutes from './leadRoutes.js';

const router = Router();

// Health check
router.get('/health', (req, res) => {
  res.json({ ok: true });
});

router.use('/fields', fieldRoutes);
router.use('/leads', leadRoutes);

export default router;
