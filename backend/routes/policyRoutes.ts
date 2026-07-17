import { Router } from 'express';
import { 
  getAllPolicies,
  getPoliciesByCustomer,
  createPolicy,
  updatePolicy,
  deletePolicy
} from '../controllers/PolicyController.js';

const router = Router();

router.get('/', getAllPolicies);
router.get('/customer/:customerId', getPoliciesByCustomer);
router.post('/', createPolicy);
router.put('/:id', updatePolicy);
router.delete('/:id', deletePolicy);

export default router;
