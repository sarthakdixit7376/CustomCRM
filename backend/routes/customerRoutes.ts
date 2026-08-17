import { Router } from 'express';
import {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  updateCustomerAgent,
  deleteCustomer
} from '../controllers/CustomerController.js';
import { requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/', getCustomers);
router.get('/:id', getCustomerById);
router.post('/', createCustomer);
router.put('/:id', updateCustomer);
router.patch('/:id/agent', requireRole('ADMIN'), updateCustomerAgent);
router.delete('/:id', deleteCustomer);

export default router;
