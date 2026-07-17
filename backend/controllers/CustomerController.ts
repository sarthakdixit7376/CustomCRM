import { Request, Response } from 'express';
import { CustomerModel } from '../models/CustomerModel.js';

export const getCustomers = async (req: Request, res: Response): Promise<void> => {
  try {
    const customers = await CustomerModel.getCustomers();
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
    res.json(customer);
  } catch (error) {
    console.error('Error getting customer:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const createCustomer = async (req: Request, res: Response): Promise<void> => {
  try {
    const newCustomer = await CustomerModel.createCustomer(req.body);
    res.status(201).json(newCustomer);
  } catch (error: any) {
    console.error('Error creating customer:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
};

export const updateCustomer = async (req: Request, res: Response): Promise<void> => {
  try {
    const updatedCustomer = await CustomerModel.updateCustomer(req.params.id, req.body);
    res.json(updatedCustomer);
  } catch (error) {
    console.error('Error updating customer:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const deleteCustomer = async (req: Request, res: Response): Promise<void> => {
  try {
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

export const createPolicy = async (req: Request, res: Response): Promise<void> => {
  try {
    const newPolicy = await CustomerModel.createPolicy(req.params.id, req.body);
    res.status(201).json(newPolicy);
  } catch (error: any) {
    console.error('Error creating policy:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
};

export const deletePolicy = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await CustomerModel.deletePolicy(req.params.policyId);
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
