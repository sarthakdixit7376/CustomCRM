import prisma from '../config/prisma.js';

export interface DateRange {
  start?: Date;
  end?: Date;
}

/** Builds a Prisma date-field filter from an optional range, or undefined if the range is empty. */
const dateFilter = (range?: DateRange): { gte?: Date; lte?: Date } | undefined => {
  if (!range || (!range.start && !range.end)) return undefined;
  const filter: { gte?: Date; lte?: Date } = {};
  if (range.start) filter.gte = range.start;
  if (range.end) filter.lte = range.end;
  return filter;
};

export const ReportModel = {
  /**
   * Per-agent performance: how many customers and leads each active user is
   * currently handling, how many of their leads have converted to customers,
   * and the resulting conversion rate. When a date range is given, "leads" and
   * "converted" are scoped to that range (by Lead.createdAt / Customer.createdAt);
   * otherwise every currently-open lead and every past conversion counts.
   */
  getAgentPerformance: async (range?: DateRange) => {
    const users = await prisma.user.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });

    const createdAt = dateFilter(range);

    return Promise.all(
      users.map(async (user) => {
        const [customerCount, leadCount, convertedCount] = await Promise.all([
          prisma.customer.count({ where: { agentId: user.id } }),
          prisma.lead.count({ where: { agentId: user.id, ...(createdAt ? { createdAt } : {}) } }),
          prisma.customer.count({ where: { agentId: user.id, convertedFromLead: true, ...(createdAt ? { createdAt } : {}) } }),
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
   * Per-agent lead-pipeline performance: assigned/contacted/not-contacted/quoted/converted lead
   * counts, plus the agent's current customer follow-up backlog. "Contacted" means the lead's
   * flow status has moved past NEW. "Quotes Sent" counts a lead once it has ever passed through
   * the Quote Sent stage (via the flow-status history log), even if it has since moved further
   * along — but like Converted, this undercounts leads that already converted before this report
   * existed, since a lead's history log is deleted along with it on conversion. A date range scopes
   * Assigned/Contacted/Not Contacted/Quotes Sent/Converted to that range; the follow-up backlog
   * (Due/Overdue) is always the agent's live, current backlog, unaffected by the date range.
   */
  getLeadPerformance: async (range?: DateRange) => {
    const users = await prisma.user.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });

    const createdAt = dateFilter(range);
    const now = new Date();

    return Promise.all(
      users.map(async (user) => {
        const [
          leadsAssigned,
          leadsContacted,
          leadsNotContacted,
          quotesSentLeads,
          convertedCount,
          dueFollowUps,
          overdueFollowUps,
        ] = await Promise.all([
          prisma.lead.count({ where: { agentId: user.id, ...(createdAt ? { createdAt } : {}) } }),
          prisma.lead.count({ where: { agentId: user.id, leadFlowStatus: { not: 'NEW' }, ...(createdAt ? { createdAt } : {}) } }),
          prisma.lead.count({ where: { agentId: user.id, leadFlowStatus: 'NEW', ...(createdAt ? { createdAt } : {}) } }),
          prisma.leadFlowStatusLog.findMany({
            where: { toStatus: 'QUOTE_SENT', lead: { agentId: user.id }, ...(createdAt ? { createdAt } : {}) },
            select: { leadId: true },
            distinct: ['leadId'],
          }),
          prisma.customer.count({ where: { agentId: user.id, convertedFromLead: true, ...(createdAt ? { createdAt } : {}) } }),
          prisma.reminder.count({ where: { customer: { agentId: user.id }, isRead: false, remindAt: { gte: now } } }),
          prisma.reminder.count({ where: { customer: { agentId: user.id }, isRead: false, remindAt: { lt: now } } }),
        ]);

        return {
          id: user.id,
          name: user.name,
          leadsAssigned,
          leadsContacted,
          leadsNotContacted,
          quotesSent: quotesSentLeads.length,
          dueFollowUps,
          overdueFollowUps,
          convertedCount,
        };
      })
    );
  },

  /**
   * Per-agent renewal outreach: how many of an agent's customers hold a policy due for renewal,
   * how many of those have been contacted at least once, and how many have been closed out as
   * renewed. Counts distinct customers, since one customer can hold several policies that are
   * each due for renewal. Without a date range, "due for renewal" defaults to the rolling window
   * of policies expiring within 30 days (or already expired). With a date range, it instead means
   * policies whose end date falls within that range.
   */
  getRenewalPerformance: async (range?: DateRange) => {
    const users = await prisma.user.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });

    let endDateFilter: { gte?: Date; lte?: Date };
    if (range?.start || range?.end) {
      endDateFilter = dateFilter(range)!;
    } else {
      const renewalWindowEnd = new Date();
      renewalWindowEnd.setDate(renewalWindowEnd.getDate() + 30);
      endDateFilter = { lte: renewalWindowEnd };
    }

    return Promise.all(
      users.map(async (user) => {
        const duePolicies = await prisma.policy.findMany({
          where: {
            customer: { agentId: user.id },
            endDate: endDateFilter,
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
   * setting later only affects future conversions, never past ones. A date range scopes this
   * to customers converted within that range (by Customer.createdAt).
   */
  getProfitPerformance: async (range?: DateRange) => {
    const createdAt = dateFilter(range);
    const [users, customers] = await Promise.all([
      prisma.user.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } }),
      prisma.customer.findMany({
        where: createdAt ? { createdAt } : undefined,
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
