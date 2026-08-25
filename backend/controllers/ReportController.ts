import { Request, Response } from 'express';
import { ReportModel } from '../models/ReportModel.js';

/**
 * GET /api/reports/agents
 * Admin-only. Per-agent customer/lead counts and lead-to-customer conversion rate.
 */
export const getAgentReport = async (_req: Request, res: Response): Promise<void> => {
  try {
    const report = await ReportModel.getAgentPerformance();
    res.json(report);
  } catch (error) {
    console.error('Error getting agent report:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
