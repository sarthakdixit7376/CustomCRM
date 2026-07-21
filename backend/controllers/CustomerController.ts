import { Request, Response } from 'express';
import { CustomerModel } from '../models/CustomerModel.js';

export const getCustomers = async (req: Request, res: Response): Promise<void> => {
  try {
    const scopeAgentId = req.user!.role === 'ADMIN' ? undefined : req.user!.id;
    const customers = await CustomerModel.getCustomers(scopeAgentId);
    res.json(customers);
  } catch (error) {
    console.error('Error getting customers:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getCustomerById = async (req: Request, res: Response): Promise<void> => {
  try {
    const customer = await CustomerModel.getCustomerById(req.params.id);
    if (!customer) {
      res.status(404).json({ error: 'Customer not found' });
      return;
    }
    if (req.user!.role !== 'ADMIN' && customer.agentId !== req.user!.id) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
    res.json(customer);
  } catch (error) {
    console.error('Error getting customer:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const createCustomer = async (req: Request, res: Response): Promise<void> => {
  try {
    const newCustomer = await CustomerModel.createCustomer(req.body, req.user!.id);
    res.status(201).json(newCustomer);
  } catch (error: any) {
    console.error('Error creating customer:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
};

export const updateCustomer = async (req: Request, res: Response): Promise<void> => {
  try {
    const existing = await CustomerModel.getCustomerById(req.params.id);
    if (!existing) {
      res.status(404).json({ error: 'Customer not found' });
      return;
    }
    if (req.user!.role !== 'ADMIN' && existing.agentId !== req.user!.id) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const updatedCustomer = await CustomerModel.updateCustomer(req.params.id, req.body);
    res.json(updatedCustomer);
  } catch (error) {
    console.error('Error updating customer:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const deleteCustomer = async (req: Request, res: Response): Promise<void> => {
  try {
    const existing = await CustomerModel.getCustomerById(req.params.id);
    if (!existing) {
      res.status(404).json({ error: 'Customer not found' });
      return;
    }
    if (req.user!.role !== 'ADMIN' && existing.agentId !== req.user!.id) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const result = await CustomerModel.deleteCustomer(req.params.id);
    if (!result) {
      res.status(404).json({ error: 'Customer not found' });
      return;
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting customer:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
