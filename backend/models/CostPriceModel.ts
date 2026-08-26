import prisma from '../config/prisma.js';

export const COST_PRICE_CATEGORIES = ['MANDATORY', 'THIRD_PARTY', 'COMPLIMENTARY'] as const;
export type CostPriceCategory = (typeof COST_PRICE_CATEGORIES)[number];

export const CostPriceModel = {
  /** Returns all 3 categories, seeding any missing one at 0 so the page always has a full set. */
  getAll: async () => {
    const existing = await prisma.insuranceCostPrice.findMany();
    const byCategory = new Map(existing.map((row) => [row.category, row]));

    const missing = COST_PRICE_CATEGORIES.filter((c) => !byCategory.has(c));
    if (missing.length > 0) {
      await prisma.insuranceCostPrice.createMany({
        data: missing.map((category) => ({ category, costPrice: 0 })),
        skipDuplicates: true,
      });
      return prisma.insuranceCostPrice.findMany();
    }

    return existing;
  },

  upsertCategory: async (category: string, costPrice: number) => {
    return prisma.insuranceCostPrice.upsert({
      where: { category },
      update: { costPrice },
      create: { category, costPrice },
    });
  },
};
