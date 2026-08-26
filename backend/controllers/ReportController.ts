import { Request, Response } from 'express';
import { ReportModel, DateRange } from '../models/ReportModel.js';

/** Parses optional ?startDate=&endDate= query params (YYYY-MM-DD) into a DateRange. */
const parseDateRange = (req: Request): DateRange | undefined => {
  const { startDate, endDate } = req.query;
  const start = typeof startDate === 'string' && startDate ? new Date(`${startDate}T00:00:00.000Z`) : undefined;
  const end = typeof endDate === 'string' && endDate ? new Date(`${endDate}T23:59:59.999Z`) : undefined;
  if ((start && Number.isNaN(start.getTime())) || (end && Number.isNaN(end.getTime()))) return undefined;
  if (!start && !end) return undefined;
  return { start, end };
};

/**
 * GET /api/reports/lead-performance
 * Admin-only. Per-agent lead pipeline: assigned/contacted/not-contacted/quoted/converted leads,
 * plus the agent's current customer follow-up backlog (due/overdue).
 */
export const getLeadPerformanceReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const report = await ReportModel.getLeadPerformance(parseDateRange(req));
    res.json(report);
  } catch (error) {
    console.error('Error getting lead performance report:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * GET /api/reports/agents
 * Admin-only. Per-agent customer/lead counts and lead-to-customer conversion rate.
 */
export const getAgentReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const report = await ReportModel.getAgentPerformance(parseDateRange(req));
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
export const getRenewalReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const report = await ReportModel.getRenewalPerformance(parseDateRange(req));
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
export const getProfitReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const report = await ReportModel.getProfitPerformance(parseDateRange(req));
    res.json(report);
  } catch (error) {
    console.error('Error getting profit report:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
