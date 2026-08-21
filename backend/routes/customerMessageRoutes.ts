import { Router } from 'express';
import {
  getMessagesByCustomer,
  createMessage,
  deleteMessage,
} from '../controllers/CustomerMessageController.js';

const router = Router();

router.get('/customer/:customerId', getMessagesByCustomer);
router.post('/', createMessage);
router.delete('/:id', deleteMessage);

export default router;
