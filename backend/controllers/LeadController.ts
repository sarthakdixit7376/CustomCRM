import { Request, Response } from 'express';
import { LeadModel } from '../models/LeadModel.js';
import prisma from '../config/prisma.js';

export const getLeads = async (req: Request, res: Response): Promise<void> => {
  try {
    const scopeAgentId = req.user!.role === 'ADMIN' ? undefined : req.user!.id;
    const leads = await LeadModel.getLeads(scopeAgentId);
    res.json(leads);
  } catch (error) {
    console.error('Error reading leads:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const createLead = async (req: Request, res: Response): Promise<void> => {
  try {
    const newLead = await LeadModel.createLead(req.body, req.user!.id);
    res.status(201).json(newLead);
  } catch (error) {
    console.error('Error writing lead:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const deleteLead = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const existing = await LeadModel.getLeadById(id);
    if (!existing) {
      res.status(404).json({ error: 'Lead not found' });
      return;
    }
    if (req.user!.role !== 'ADMIN' && existing.agentId !== req.user!.id) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

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

export const getLeadById = async (req: Request, res: Response): Promise<void> => {
  try {
    const lead = await LeadModel.getLeadById(req.params.id);
    if (!lead) {
      res.status(404).json({ error: 'Lead not found' });
      return;
    }
    if (req.user!.role !== 'ADMIN' && lead.agentId !== req.user!.id) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
    res.json(lead);
  } catch (error) {
    console.error('Error reading lead:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const updateLeadAgent = async (req: Request, res: Response): Promise<void> => {
  try {
    const existing = await LeadModel.getLeadById(req.params.id);
    if (!existing) {
      res.status(404).json({ error: 'Lead not found' });
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

    const updated = await LeadModel.updateLeadAgent(req.params.id, agentId);
    res.json(updated);
  } catch (error) {
    console.error('Error updating lead agent:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const updateLeadFlowStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const lead = await LeadModel.getLeadById(req.params.id);
    if (!lead) {
      res.status(404).json({ error: 'Lead not found' });
      return;
    }
    if (req.user!.role !== 'ADMIN' && lead.agentId !== req.user!.id) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
    
    const { leadFlowStatus, note } = req.body;
    if (!leadFlowStatus) {
      res.status(400).json({ error: 'leadFlowStatus is required' });
      return;
    }

    const updated = await LeadModel.updateLeadFlowStatus(req.params.id, leadFlowStatus, req.user!.id, note);
    res.json(updated);
  } catch (error) {
    console.error('Error updating lead flow status:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
