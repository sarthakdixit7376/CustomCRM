import prisma from '../config/prisma.js';

/** Resolves the carNumber/manufacturer snapshot stored on the policy row from its linked Vehicle, if any. */
const resolveCarSnapshot = async (carId: string | null | undefined) => {
  if (!carId) return { carNumber: null, manufacturer: null };
  const vehicle = await prisma.vehicle.findUnique({ where: { id: carId } });
  return {
    carNumber: vehicle?.misparRechev ?? null,
    manufacturer: vehicle?.tozeretNm ?? null,
  };
};

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
        customer: { select: { id: true, customerName: true, email: true } },
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
    const carId = policyData.policyType === 'Car' ? (policyData.carId || null) : null;
    const carSnapshot = await resolveCarSnapshot(carId);

    return prisma.policy.create({
      data: {
        policyNumber: policyData.policyNumber,
        policyType: policyData.policyType || 'General',
        insuranceCompany: policyData.insuranceCompany,
        agentName: policyData.agentName || null,
        carId,
        carNumber: carSnapshot.carNumber,
        manufacturer: carSnapshot.manufacturer,
        glassAndMoreSelected: Boolean(policyData.glassAndMoreSelected),
        complementaryVipSelected: Boolean(policyData.complementaryVipSelected),
        amountPaid: toNumber(policyData.amountPaid) ?? null,
        startDate: toDate(policyData.startDate) ?? null,
        endDate: toDate(policyData.endDate) ?? null,
        type: policyData.type || null,
        status: policyData.status || 'Active',
        customerId,
      },
      include: {
        customer: { select: { id: true, customerName: true, email: true } },
      },
    });
  },

  updatePolicy: async (id: string, policyData: any) => {
    const carIdProvided = policyData.carId !== undefined;
    const carSnapshot = carIdProvided ? await resolveCarSnapshot(policyData.carId) : null;

    return prisma.policy.update({
      where: { id },
      data: {
        policyNumber: policyData.policyNumber,
        policyType: policyData.policyType,
        insuranceCompany: policyData.insuranceCompany,
        agentName: policyData.agentName,
        carId: carIdProvided ? (policyData.carId || null) : undefined,
        carNumber: carSnapshot ? carSnapshot.carNumber : policyData.carNumber,
        manufacturer: carSnapshot ? carSnapshot.manufacturer : policyData.manufacturer,
        glassAndMoreSelected: policyData.glassAndMoreSelected,
        complementaryVipSelected: policyData.complementaryVipSelected,
        amountPaid: toNumber(policyData.amountPaid),
        startDate: toDate(policyData.startDate),
        endDate: toDate(policyData.endDate),
        type: policyData.type,
        status: policyData.status,
      },
      include: {
        customer: { select: { id: true, customerName: true, email: true } },
      },
    });
  },

  updatePolicyFile: async (id: string, fileId: string, fileUrl: string) => {
    return prisma.policy.update({
      where: { id },
      data: { fileId, fileUrl },
      include: {
        customer: { select: { id: true, customerName: true, email: true } },
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
