import { Router } from 'express';
import { 
  getCustomers, 
  getCustomerById, 
  createCustomer, 
  updateCustomer, 
  deleteCustomer,
  createPolicy,
  deletePolicy
} from '../controllers/CustomerController.js';

const router = Router();

router.get('/', getCustomers);
router.get('/:id', getCustomerById);
router.post('/', createCustomer);
router.put('/:id', updateCustomer);
router.delete('/:id', deleteCustomer);

router.post('/:id/policies', createPolicy);
router.delete('/:id/policies/:policyId', deletePolicy);

export default router;
