import prisma from '../config/prisma.js';
import { fetchVehicleGovData, mapVehicleGovFields } from '../services/vehicleGovService.js';

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

export const CustomerModel = {
  getCustomers: async (agentId?: string) => {
    return prisma.customer.findMany({
      where: agentId ? { agentId } : undefined,
      include: {
        contacts: true,
        policies: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  },

  getCustomerById: async (id: string) => {
    return prisma.customer.findUnique({
      where: { id },
      include: {
        contacts: true,
        policies: true,
      },
    });
  },

  createCustomer: async (data: any, agentId: string) => {
    const { contacts, policies, ...customerData } = data;

    const normalizedPolicies = policies?.map((p: any) => ({
      ...p,
      startDate: toDate(p.startDate) ?? null,
      endDate: toDate(p.endDate) ?? null,
      amountPaid: toNumber(p.amountPaid) ?? null,
    }));

    // Auto-fetch vehicle details from the gov registry so the customer's vehicle fields
    // (shown on the Customer Card) aren't left blank when created directly (not via lead conversion).
    const carPolicy = normalizedPolicies?.find((p: any) => p.policyType === 'Car' && p.carNumber);
    const vehicleGovData = carPolicy ? await fetchVehicleGovData(carPolicy.carNumber) : {};
    const vehicleFields = mapVehicleGovFields(vehicleGovData);
    if (carPolicy && !carPolicy.manufacturer) {
      carPolicy.manufacturer = vehicleFields.tozeretNm ?? null;
    }

    return prisma.customer.create({
      data: {
        ...customerData,
        ...vehicleFields,
        agentId,
        contacts: contacts ? { create: contacts } : undefined,
        policies: normalizedPolicies ? { create: normalizedPolicies } : undefined,
      },
      include: {
        contacts: true,
        policies: true,
      },
    });
  },

  updateCustomer: async (id: string, data: any) => {
    const { contacts, policies, ...customerData } = data;
    
    // For simplicity in this CRM, we delete existing nested records and recreate them 
    // or just update if we have a robust update schema. Let's delete and recreate contacts and policies to ensure sync.
    // However, if policies are large, maybe we should handle them individually.
    // Given the prompt, we will use a straightforward update approach.
    
    // Transaction to safely update customer and its relations
    return prisma.$transaction(async (tx) => {
      if (contacts) {
        await tx.contact.deleteMany({ where: { customerId: id } });
      }
      
      const updatedCustomer = await tx.customer.update({
        where: { id },
        data: {
          ...customerData,
          contacts: contacts ? { create: contacts } : undefined,
          // Not updating policies here to prevent data loss if policies are added separately
        },
        include: {
          contacts: true,
          policies: true,
        },
      });

      return updatedCustomer;
    });
  },

  deleteCustomer: async (id: string) => {
    try {
      await prisma.$transaction([
        prisma.contact.deleteMany({ where: { customerId: id } }),
        prisma.policy.deleteMany({ where: { customerId: id } }),
        prisma.customer.delete({ where: { id } }),
      ]);
      return true;
    } catch (error) {
      console.error("Error in deleteCustomer:", error);
      return null;
    }
  }
};
