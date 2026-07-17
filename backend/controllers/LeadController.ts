import { Request, Response } from 'express';
import { LeadModel } from '../models/LeadModel.js';

export const getLeads = async (req: Request, res: Response): Promise<void> => {
  try {
    const leads = await LeadModel.getLeads();
    res.json(leads);
  } catch (error) {
    console.error('Error reading leads:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const createLead = async (req: Request, res: Response): Promise<void> => {
  try {
    const newLead = await LeadModel.createLead(req.body);
    res.status(201).json(newLead);
  } catch (error) {
    console.error('Error writing lead:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const deleteLead = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  
  try {
    const result = await LeadModel.deleteLead(id);
    if (!result) {
      res.status(404).json({ error: 'Lead not found' });
      return;
    }
    res.json({ success: true, id });
  } catch (error) {
    console.error('Error deleting lead:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
