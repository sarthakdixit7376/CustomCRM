import prisma from '../config/prisma.js';

export const ReportModel = {
  /**
   * Per-agent performance: how many customers and leads each active user is
   * currently handling, how many of their leads have converted to customers,
   * and the resulting conversion rate.
   */
  getAgentPerformance: async () => {
    const users = await prisma.user.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });

    return Promise.all(
      users.map(async (user) => {
        const [customerCount, leadCount, convertedCount] = await Promise.all([
          prisma.customer.count({ where: { agentId: user.id } }),
          prisma.lead.count({ where: { agentId: user.id } }),
          prisma.customer.count({ where: { agentId: user.id, convertedFromLead: true } }),
        ]);

        const conversionRate = leadCount > 0 ? (convertedCount / leadCount) * 100 : 0;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          customerCount,
          leadCount,
          convertedCount,
          conversionRate,
        };
      })
    );
  },
};
