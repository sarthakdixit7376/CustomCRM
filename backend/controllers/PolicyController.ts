import { Request, Response } from 'express';
import { PolicyModel } from '../models/PolicyModel.js';
import { CustomerModel } from '../models/CustomerModel.js';

export const getAllPolicies = async (req: Request, res: Response): Promise<void> => {
  try {
    const scopeAgentId = req.user!.role === 'ADMIN' ? undefined : req.user!.id;
    const policies = await PolicyModel.getAllPolicies(scopeAgentId);
    res.json(policies);
  } catch (error) {
    console.error('Error getting policies:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getPoliciesByCustomer = async (req: Request, res: Response): Promise<void> => {
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

    const policies = await PolicyModel.getPoliciesByCustomerId(req.params.customerId);
    res.json(policies);
  } catch (error) {
    console.error('Error getting policies:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const createPolicy = async (req: Request, res: Response): Promise<void> => {
  try {
    if (req.body.customerId) {
      const customer = await CustomerModel.getCustomerById(req.body.customerId);
      if (!customer) {
        res.status(404).json({ error: 'Customer not found' });
        return;
      }
      if (req.user!.role !== 'ADMIN' && customer.agentId !== req.user!.id) {
        res.status(403).json({ error: 'Forbidden' });
        return;
      }
    }

    const newPolicy = await PolicyModel.createPolicy(req.body, req.body.customerId);
    res.status(201).json(newPolicy);
  } catch (error: any) {
    console.error('Error creating policy:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
};

export const updatePolicy = async (req: Request, res: Response): Promise<void> => {
  try {
    const existing = await PolicyModel.getPolicyById(req.params.id);
    if (!existing) {
      res.status(404).json({ error: 'Policy not found' });
      return;
    }
    if (req.user!.role !== 'ADMIN' && existing.customer?.agentId !== req.user!.id) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const updatedPolicy = await PolicyModel.updatePolicy(req.params.id, req.body);
    res.json(updatedPolicy);
  } catch (error) {
    console.error('Error updating policy:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const deletePolicy = async (req: Request, res: Response): Promise<void> => {
  try {
    const existing = await PolicyModel.getPolicyById(req.params.id);
    if (!existing) {
      res.status(404).json({ error: 'Policy not found' });
      return;
    }
    if (req.user!.role !== 'ADMIN' && existing.customer?.agentId !== req.user!.id) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const result = await PolicyModel.deletePolicy(req.params.id);
    if (!result) {
      res.status(404).json({ error: 'Policy not found' });
      return;
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting policy:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
