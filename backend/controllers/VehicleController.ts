import { Request, Response } from 'express';
import { VehicleModel } from '../models/VehicleModel.js';
import { CustomerModel } from '../models/CustomerModel.js';

export const getVehiclesByCustomer = async (req: Request, res: Response): Promise<void> => {
  try {
    const customer = await CustomerModel.getCustomerById(req.params.customerId);
    if (!customer) {
      res.status(404).json({ error: 'Customer not found' });
      return;
    }
    if (req.user!.role !== 'ADMIN' && customer.agentId !== req.user!.id) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const vehicles = await VehicleModel.getVehiclesByCustomerId(req.params.customerId);
    res.json(vehicles);
  } catch (error) {
    console.error('Error getting vehicles:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const createVehicle = async (req: Request, res: Response): Promise<void> => {
  try {
    const customer = await CustomerModel.getCustomerById(req.params.customerId);
    if (!customer) {
      res.status(404).json({ error: 'Customer not found' });
      return;
    }
    if (req.user!.role !== 'ADMIN' && customer.agentId !== req.user!.id) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
    if (!req.body.carNumber) {
      res.status(400).json({ error: 'carNumber is required' });
      return;
    }

    const newVehicle = await VehicleModel.createVehicle(req.params.customerId, req.body.carNumber);
    res.status(201).json(newVehicle);
  } catch (error: any) {
    console.error('Error creating vehicle:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
};

export const updateVehicle = async (req: Request, res: Response): Promise<void> => {
  try {
    const existing = await VehicleModel.getVehicleById(req.params.id);
    if (!existing) {
      res.status(404).json({ error: 'Vehicle not found' });
      return;
    }
    if (req.user!.role !== 'ADMIN' && existing.customer.agentId !== req.user!.id) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const updatedVehicle = await VehicleModel.updateVehicle(req.params.id, req.body);
    res.json(updatedVehicle);
  } catch (error) {
    console.error('Error updating vehicle:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const deleteVehicle = async (req: Request, res: Response): Promise<void> => {
  try {
    const existing = await VehicleModel.getVehicleById(req.params.id);
    if (!existing) {
      res.status(404).json({ error: 'Vehicle not found' });
      return;
    }
    if (req.user!.role !== 'ADMIN' && existing.customer.agentId !== req.user!.id) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const policyCount = existing.policies.length;
    await VehicleModel.deleteVehicle(req.params.id);
    res.json({ success: true, deletedPolicyCount: policyCount });
  } catch (error) {
    console.error('Error deleting vehicle:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
