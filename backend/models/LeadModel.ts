import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const LeadModel = {
  getLeads: async () => {
    return prisma.lead.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  },

  createLead: async (leadData: any) => {
    return prisma.lead.create({
      data: {
        leadName: leadData.lead_name || leadData.leadName,
        phoneNumber: leadData.phone_number || leadData.phoneNumber,
        vehicleNumber: leadData.vehicle_number || leadData.vehicleNumber,
        engineCc: leadData.engine_cc || leadData.engineCc,
        registrationNumber: leadData.registration_number || leadData.registrationNumber,
        validUntil: leadData.valid_until || leadData.validUntil,
        vehicleType: leadData.vehicle_type || leadData.vehicleType,
        vehicleModel: leadData.vehicle_model || leadData.vehicleModel,
        pdfUrl: leadData.pdfUrl,
      },
    });
  },

  deleteLead: async (id: string) => {
    try {
      await prisma.lead.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      // If it doesn't exist, prisma throws
      return null;
    }
  },
};
