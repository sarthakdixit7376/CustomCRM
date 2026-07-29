import prisma from '../config/prisma.js';

/** undefined -> undefined (skip field), '' / null -> null (clear), else -> Date */
const toDate = (value: any): Date | null | undefined => {
  if (value === undefined) return undefined;
  if (!value) return null;
  return new Date(value);
};

/** undefined -> undefined (skip field), '' / null -> null (clear), else -> Number */
const toNumber = (value: any): number | null | undefined => {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  const n = Number(value);
  return Number.isNaN(n) ? null : n;
};

export const PolicyModel = {
  getAllPolicies: async (agentId?: string) => {
    return prisma.policy.findMany({
      where: agentId ? { customer: { agentId } } : undefined,
      orderBy: { id: 'desc' },
      include: {
        customer: { select: { id: true, customerName: true } },
      },
    });
  },

  getPoliciesByCustomerId: async (customerId: string) => {
    return prisma.policy.findMany({
      where: { customerId },
    });
  },

  getPolicyById: async (id: string) => {
    return prisma.policy.findUnique({
      where: { id },
      include: { customer: true },
    });
  },

  createPolicy: async (policyData: any, customerId: string) => {
    return prisma.policy.create({
      data: {
        policyNumber: policyData.policyNumber,
        policyType: policyData.policyType || 'General',
        insuranceCompany: policyData.insuranceCompany,
        agentName: policyData.agentName || null,
        carNumber: policyData.carNumber || null,
        manufacturer: policyData.manufacturer || null,
        glassAndMoreSelected: Boolean(policyData.glassAndMoreSelected),
        complementaryVipSelected: Boolean(policyData.complementaryVipSelected),
        amountPaid: toNumber(policyData.amountPaid) ?? null,
        startDate: toDate(policyData.startDate) ?? null,
        endDate: toDate(policyData.endDate) ?? null,
        type: policyData.type || null,
        status: policyData.status || 'Active',
        customerId,
      },
    });
  },

  updatePolicy: async (id: string, policyData: any) => {
    return prisma.policy.update({
      where: { id },
      data: {
        policyNumber: policyData.policyNumber,
        policyType: policyData.policyType,
        insuranceCompany: policyData.insuranceCompany,
        agentName: policyData.agentName,
        carNumber: policyData.carNumber,
        manufacturer: policyData.manufacturer,
        glassAndMoreSelected: policyData.glassAndMoreSelected,
        complementaryVipSelected: policyData.complementaryVipSelected,
        amountPaid: toNumber(policyData.amountPaid),
        startDate: toDate(policyData.startDate),
        endDate: toDate(policyData.endDate),
        type: policyData.type,
        status: policyData.status,
      },
    });
  },

  deletePolicy: async (id: string) => {
    try {
      await prisma.policy.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      return null;
    }
  },
};
