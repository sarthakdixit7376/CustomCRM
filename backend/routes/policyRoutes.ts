import { Router } from 'express';
import {
  getAllPolicies,
  getPoliciesByCustomer,
  createPolicy,
  updatePolicy,
  deletePolicy,
  uploadPolicyFile,
  getPolicyDocuments,
  deletePolicyDocument,
  policyFileUpload
} from '../controllers/PolicyController.js';

const router = Router();

router.get('/', getAllPolicies);
router.get('/customer/:customerId', getPoliciesByCustomer);
router.post('/', createPolicy);
router.put('/:id', updatePolicy);
router.post('/:id/file', policyFileUpload.single('file'), uploadPolicyFile);
router.get('/:id/documents', getPolicyDocuments);
router.delete('/:id', deletePolicy);
router.delete('/documents/:id', deletePolicyDocument);

export default router;
