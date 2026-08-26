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

  /**
   * Per-agent profit: (customer's selling price − that customer's snapshotted cost price)
   * summed per agent, per insurance category (Mandatory / Third Party / Complimentary).
   * A customer with no price set for a category contributes nothing to that category (no
   * sale, not a loss). Cost price is the value captured on the customer at conversion time
   * (see LeadModel.convertToCustomer), not the current Cost Price setting — so editing the
   * setting later only affects future conversions, never past ones.
   */
  getProfitPerformance: async () => {
    const [users, customers] = await Promise.all([
      prisma.user.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } }),
      prisma.customer.findMany({
        select: {
          agentId: true,
          mandatoryPrice: true,
          thirdPartyPrice: true,
          complimentaryPrice: true,
          mandatoryCostPrice: true,
          thirdPartyCostPrice: true,
          complimentaryCostPrice: true,
        },
      }),
    ]);

    return users.map((user) => {
      const myCustomers = customers.filter((c) => c.agentId === user.id);

      const sumProfit = (rows: { selling: number | null; cost: number | null }[]): number =>
        rows.reduce((sum: number, { selling, cost }) => (selling == null ? sum : sum + (selling - (cost ?? 0))), 0);

      const mandatoryProfit = sumProfit(myCustomers.map((c) => ({ selling: c.mandatoryPrice, cost: c.mandatoryCostPrice })));
      const thirdPartyProfit = sumProfit(myCustomers.map((c) => ({ selling: c.thirdPartyPrice, cost: c.thirdPartyCostPrice })));
      const complimentaryProfit = sumProfit(myCustomers.map((c) => ({ selling: c.complimentaryPrice, cost: c.complimentaryCostPrice })));

      return {
        id: user.id,
        name: user.name,
        mandatoryProfit,
        thirdPartyProfit,
        complimentaryProfit,
        totalProfit: mandatoryProfit + thirdPartyProfit + complimentaryProfit,
      };
    });
  },
};
