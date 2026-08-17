import { Request, Response } from 'express';
import { CustomerModel } from '../models/CustomerModel.js';
import prisma from '../config/prisma.js';

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
    // Only admins may assign a customer to someone other than themselves on creation.
    const requestedAgentId = req.body.agentId;
    const agentId = req.user!.role === 'ADMIN' && requestedAgentId ? requestedAgentId : req.user!.id;
    const newCustomer = await CustomerModel.createCustomer(req.body, agentId);
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

export const updateCustomerAgent = async (req: Request, res: Response): Promise<void> => {
  try {
    const existing = await CustomerModel.getCustomerById(req.params.id);
    if (!existing) {
      res.status(404).json({ error: 'Customer not found' });
      return;
    }

    const { agentId } = req.body;
    if (!agentId) {
      res.status(400).json({ error: 'agentId is required' });
      return;
    }

    const agent = await prisma.user.findUnique({ where: { id: agentId } });
    if (!agent) {
      res.status(400).json({ error: 'Agent not found' });
      return;
    }

    const updated = await CustomerModel.updateCustomerAgent(req.params.id, agentId);
    res.json(updated);
  } catch (error) {
    console.error('Error updating customer agent:', error);
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
