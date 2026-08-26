import { Request, Response } from 'express';
import { CostPriceModel, COST_PRICE_CATEGORIES } from '../models/CostPriceModel.js';

/**
 * GET /api/cost-prices
 * Admin-only. Returns all 3 category cost prices, seeding any missing one at 0.
 */
export const getCostPrices = async (_req: Request, res: Response): Promise<void> => {
  try {
    const costPrices = await CostPriceModel.getAll();
    res.json(costPrices);
  } catch (error) {
    console.error('Error getting cost prices:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * PUT /api/cost-prices/:category
 * Admin-only. Sets the cost price for one category.
 */
export const updateCostPrice = async (req: Request, res: Response): Promise<void> => {
  try {
    const { category } = req.params;
    if (!COST_PRICE_CATEGORIES.includes(category as any)) {
      res.status(400).json({ error: `category must be one of ${COST_PRICE_CATEGORIES.join(', ')}` });
      return;
    }

    const costPrice = Number(req.body.costPrice);
    if (Number.isNaN(costPrice) || costPrice < 0) {
      res.status(400).json({ error: 'costPrice must be a non-negative number' });
      return;
    }

    const updated = await CostPriceModel.upsertCategory(category, costPrice);
    res.json(updated);
  } catch (error: any) {
    console.error('Error updating cost price:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
};
