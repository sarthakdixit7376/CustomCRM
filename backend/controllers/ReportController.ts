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

/**
 * GET /api/reports/renewals
 * Admin-only. Per-agent renewal outreach: customers due for renewal, contacted, and closed.
 */
export const getRenewalReport = async (_req: Request, res: Response): Promise<void> => {
  try {
    const report = await ReportModel.getRenewalPerformance();
    res.json(report);
  } catch (error) {
    console.error('Error getting renewal report:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * GET /api/reports/profit
 * Admin-only. Per-agent profit (selling price − cost price) per insurance category.
 */
export const getProfitReport = async (_req: Request, res: Response): Promise<void> => {
  try {
    const report = await ReportModel.getProfitPerformance();
    res.json(report);
  } catch (error) {
    console.error('Error getting profit report:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
