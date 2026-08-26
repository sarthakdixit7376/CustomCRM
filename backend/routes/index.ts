import { Router } from 'express';
import fieldRoutes from './fieldRoutes.js';
import leadRoutes from './leadRoutes.js';
import customerRoutes from './customerRoutes.js';
import policyRoutes from './policyRoutes.js';
import vehicleRoutes from './vehicleRoutes.js';
import userRoutes from './userRoutes.js';
import invitationRoutes from './invitationRoutes.js';
import emailRoutes from './emailRoutes.js';
import reminderRoutes from './reminderRoutes.js';
import customerMessageRoutes from './customerMessageRoutes.js';
import reportRoutes from './reportRoutes.js';
import costPriceRoutes from './costPriceRoutes.js';

const router = Router();

router.use('/fields', fieldRoutes);
router.use('/leads', leadRoutes);
router.use('/customers', customerRoutes);
router.use('/policies', policyRoutes);
router.use('/vehicles', vehicleRoutes);
router.use('/users', userRoutes);
router.use('/invitations', invitationRoutes);
router.use('/email', emailRoutes);
router.use('/reminders', reminderRoutes);
router.use('/messages', customerMessageRoutes);
router.use('/reports', reportRoutes);
router.use('/cost-prices', costPriceRoutes);

export default router;
