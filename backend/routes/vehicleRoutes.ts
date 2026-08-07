import { Router } from 'express';
import {
  getVehiclesByCustomer,
  createVehicle,
  updateVehicle,
  deleteVehicle
} from '../controllers/VehicleController.js';

const router = Router();

router.get('/customer/:customerId', getVehiclesByCustomer);
router.post('/customer/:customerId', createVehicle);
router.put('/:id', updateVehicle);
router.delete('/:id', deleteVehicle);

export default router;
