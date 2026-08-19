import { Router } from 'express';
import {
  getAllReminders,
  getDueReminders,
  getRemindersByCustomer,
  createReminder,
  updateReminder,
  markReminderAsRead,
  markAllRemindersAsRead,
  deleteReminder,
} from '../controllers/ReminderController.js';

const router = Router();

router.get('/', getAllReminders);
router.get('/due', getDueReminders);
router.get('/customer/:customerId', getRemindersByCustomer);
router.post('/', createReminder);
router.put('/:id', updateReminder);
router.patch('/read-all', markAllRemindersAsRead);
router.patch('/:id/read', markReminderAsRead);
router.delete('/:id', deleteReminder);

export default router;
