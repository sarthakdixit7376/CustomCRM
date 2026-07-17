import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const CustomerModel = {
  getCustomers: async () => {
    return prisma.customer.findMany({
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

  createCustomer: async (data: any) => {
    const { contacts, policies, ...customerData } = data;
    
    return prisma.customer.create({
      data: {
        ...customerData,
        contacts: contacts ? { create: contacts } : undefined,
        policies: policies ? { create: policies } : undefined,
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
      await prisma.customer.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      return null;
    }
  },
  
  createPolicy: async (customerId: string, policyData: any) => {
    return prisma.policy.create({
      data: {
        policyNumber: policyData.policyNumber,
        policyType: policyData.policyType || 'General',
        insuranceCompany: policyData.insuranceCompany,
        startDate: policyData.startDate || null,
        endDate: policyData.endDate || null,
        type: policyData.type || null,
        status: policyData.status || 'Active',
        customerId,
      }
    });
  },
  
  deletePolicy: async (policyId: string) => {
    try {
      await prisma.policy.delete({
        where: { id: policyId },
      });
      return true;
    } catch (error) {
      return null;
    }
  }
};
