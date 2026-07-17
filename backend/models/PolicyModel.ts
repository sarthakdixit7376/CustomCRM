import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const PolicyModel = {
  getAllPolicies: async () => {
    return prisma.policy.findMany({
      orderBy: { id: 'desc' },
    });
  },

  getPoliciesByCustomerId: async (customerId: string) => {
    return prisma.policy.findMany({
      where: { customerId },
    });
  },

  createPolicy: async (policyData: any, customerId?: string) => {
    return prisma.policy.create({
      data: {
        policyNumber: policyData.policyNumber,
        policyType: policyData.policyType || 'General',
        insuranceCompany: policyData.insuranceCompany,
        startDate: policyData.startDate || null,
        endDate: policyData.endDate || null,
        type: policyData.type || null,
        status: policyData.status || 'Active',
        customerId: customerId || null,
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
        startDate: policyData.startDate,
        endDate: policyData.endDate,
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
