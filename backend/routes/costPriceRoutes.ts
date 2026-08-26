import { Router } from 'express';
import { getCostPrices, updateCostPrice } from '../controllers/CostPriceController.js';
import { requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/', requireRole('ADMIN'), getCostPrices);
router.put('/:category', requireRole('ADMIN'), updateCostPrice);

export default router;
