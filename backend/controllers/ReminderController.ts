import { Request, Response } from 'express';
import { ReminderModel } from '../models/ReminderModel.js';
import { CustomerModel } from '../models/CustomerModel.js';

/**
 * GET /api/reminders
 * List all reminders scoped by user role.
 */
export const getAllReminders = async (req: Request, res: Response): Promise<void> => {
  try {
    const scopeAgentId = req.user!.role === 'ADMIN' ? undefined : req.user!.id;
    const reminders = await ReminderModel.getReminders(scopeAgentId);
    res.json(reminders);
  } catch (error) {
    console.error('Error getting reminders:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * GET /api/reminders/due
 * Get due/overdue unread reminders for the notification bell.
 */
export const getDueReminders = async (req: Request, res: Response): Promise<void> => {
  try {
    const scopeAgentId = req.user!.role === 'ADMIN' ? undefined : req.user!.id;
    const reminders = await ReminderModel.getDueReminders(scopeAgentId);
    res.json(reminders);
  } catch (error) {
    console.error('Error getting due reminders:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * GET /api/reminders/customer/:customerId
 * Get reminders for a specific customer.
 */
export const getRemindersByCustomer = async (req: Request, res: Response): Promise<void> => {
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

    const reminders = await ReminderModel.getRemindersByCustomer(req.params.customerId);
    res.json(reminders);
  } catch (error) {
    console.error('Error getting customer reminders:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * POST /api/reminders
 * Create a manual reminder.
 */
export const createReminder = async (req: Request, res: Response): Promise<void> => {
  try {
    const { customerId, text, remindAt, policyId } = req.body;
    if (!customerId || !text || !remindAt) {
      res.status(400).json({ error: 'customerId, text, and remindAt are required' });
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

    const reminder = await ReminderModel.createReminder({
      customerId,
      text,
      remindAt,
      createdById: req.user!.id,
      policyId,
    });
    res.status(201).json(reminder);
  } catch (error: any) {
    console.error('Error creating reminder:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
};

/**
 * PUT /api/reminders/:id
 * Edit a reminder (text and/or remindAt).
 */
export const updateReminder = async (req: Request, res: Response): Promise<void> => {
  try {
    const existing = await ReminderModel.getReminderById(req.params.id);
    if (!existing) {
      res.status(404).json({ error: 'Reminder not found' });
      return;
    }
    if (req.user!.role !== 'ADMIN' && existing.customer?.agentId !== req.user!.id) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const { text, remindAt } = req.body;
    const updated = await ReminderModel.updateReminder(req.params.id, { text, remindAt });
    res.json(updated);
  } catch (error: any) {
    console.error('Error updating reminder:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
};

/**
 * PATCH /api/reminders/:id/read
 * Mark a single reminder as completed, or back to incomplete (body: { isRead?: boolean }).
 */
export const markReminderAsRead = async (req: Request, res: Response): Promise<void> => {
  try {
    const existing = await ReminderModel.getReminderById(req.params.id);
    if (!existing) {
      res.status(404).json({ error: 'Reminder not found' });
      return;
    }
    if (req.user!.role !== 'ADMIN' && existing.customer?.agentId !== req.user!.id) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const isRead = req.body.isRead === undefined ? true : Boolean(req.body.isRead);
    const updated = await ReminderModel.markAsRead(req.params.id, isRead);
    res.json(updated);
  } catch (error) {
    console.error('Error marking reminder as read:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * PATCH /api/reminders/read-all
 * Mark all due reminders as read.
 */
export const markAllRemindersAsRead = async (req: Request, res: Response): Promise<void> => {
  try {
    const scopeAgentId = req.user!.role === 'ADMIN' ? undefined : req.user!.id;
    const result = await ReminderModel.markAllAsRead(scopeAgentId);
    res.json({ success: true, count: result.count });
  } catch (error) {
    console.error('Error marking all reminders as read:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * DELETE /api/reminders/:id
 * Delete a reminder.
 */
export const deleteReminder = async (req: Request, res: Response): Promise<void> => {
  try {
    const existing = await ReminderModel.getReminderById(req.params.id);
    if (!existing) {
      res.status(404).json({ error: 'Reminder not found' });
      return;
    }
    if (req.user!.role !== 'ADMIN' && existing.customer?.agentId !== req.user!.id) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const result = await ReminderModel.deleteReminder(req.params.id);
    if (!result) {
      res.status(404).json({ error: 'Reminder not found' });
      return;
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting reminder:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
