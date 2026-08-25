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

  /**
   * Per-agent renewal outreach: how many of an agent's customers hold a policy due for renewal
   * (expiring within 30 days, or already expired), how many of those have been contacted at
   * least once, and how many have been closed out as renewed. Counts distinct customers, since
   * one customer can hold several policies that are each due for renewal.
   */
  getRenewalPerformance: async () => {
    const users = await prisma.user.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });

    const renewalWindowEnd = new Date();
    renewalWindowEnd.setDate(renewalWindowEnd.getDate() + 30);

    return Promise.all(
      users.map(async (user) => {
        const duePolicies = await prisma.policy.findMany({
          where: {
            customer: { agentId: user.id },
            endDate: { lte: renewalWindowEnd },
          },
          select: { customerId: true, renewalStatus: true },
        });

        const needsRenewalCustomers = new Set(duePolicies.map((p) => p.customerId));
        const contactedCustomers = new Set(
          duePolicies.filter((p) => p.renewalStatus !== 'NOT_CONTACTED').map((p) => p.customerId)
        );
        const renewedCustomers = new Set(
          duePolicies.filter((p) => p.renewalStatus === 'RENEWED').map((p) => p.customerId)
        );

        return {
          id: user.id,
          name: user.name,
          needsRenewalCount: needsRenewalCustomers.size,
          contactedCount: contactedCustomers.size,
          renewedCount: renewedCustomers.size,
        };
      })
    );
  },
};
