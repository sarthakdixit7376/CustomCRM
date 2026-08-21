import { Request, Response } from 'express';
import { CustomerMessageModel } from '../models/CustomerMessageModel.js';
import { CustomerModel } from '../models/CustomerModel.js';

/**
 * GET /api/messages/customer/:customerId
 * Get all messages for a specific customer.
 */
export const getMessagesByCustomer = async (req: Request, res: Response): Promise<void> => {
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

    const messages = await CustomerMessageModel.getMessagesByCustomer(req.params.customerId);
    res.json(messages);
  } catch (error) {
    console.error('Error getting customer messages:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * POST /api/messages
 * Add a message to a customer.
 */
export const createMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { customerId, text } = req.body;
    if (!customerId || !text?.trim()) {
      res.status(400).json({ error: 'customerId and text are required' });
      return;
    }

    const customer = await CustomerModel.getCustomerById(customerId);
    if (!customer) {
      res.status(404).json({ error: 'Customer not found' });
      return;
    }
    if (req.user!.role !== 'ADMIN' && customer.agentId !== req.user!.id) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const message = await CustomerMessageModel.createMessage({
      customerId,
      text: text.trim(),
      createdById: req.user!.id,
    });
    res.status(201).json(message);
  } catch (error: any) {
    console.error('Error creating message:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
};

/**
 * DELETE /api/messages/:id
 * Delete a message.
 */
export const deleteMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    const existing = await CustomerMessageModel.getMessageById(req.params.id);
    if (!existing) {
      res.status(404).json({ error: 'Message not found' });
      return;
    }
    if (req.user!.role !== 'ADMIN' && existing.customer?.agentId !== req.user!.id) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const result = await CustomerMessageModel.deleteMessage(req.params.id);
    if (!result) {
      res.status(404).json({ error: 'Message not found' });
      return;
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
