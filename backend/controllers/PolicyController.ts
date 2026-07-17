import { Request, Response } from 'express';
import { PolicyModel } from '../models/PolicyModel.js';

export const getAllPolicies = async (req: Request, res: Response): Promise<void> => {
  try {
    const policies = await PolicyModel.getAllPolicies();
    res.json(policies);
  } catch (error) {
    console.error('Error getting policies:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getPoliciesByCustomer = async (req: Request, res: Response): Promise<void> => {
  try {
    const policies = await PolicyModel.getPoliciesByCustomerId(req.params.customerId);
    res.json(policies);
  } catch (error) {
    console.error('Error getting policies:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const createPolicy = async (req: Request, res: Response): Promise<void> => {
  try {
    const newPolicy = await PolicyModel.createPolicy(req.body, req.body.customerId);
    res.status(201).json(newPolicy);
  } catch (error: any) {
    console.error('Error creating policy:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
};

export const updatePolicy = async (req: Request, res: Response): Promise<void> => {
  try {
    const updatedPolicy = await PolicyModel.updatePolicy(req.params.id, req.body);
    res.json(updatedPolicy);
  } catch (error) {
    console.error('Error updating policy:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const deletePolicy = async (req: Request, res: Response): Promise<void> => {
  try {
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
