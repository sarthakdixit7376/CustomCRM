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
        age: leadData.age != null ? String(leadData.age) : undefined,
        dateOfBirth: (leadData.date_of_birth || leadData.dateOfBirth) != null ? String(leadData.date_of_birth || leadData.dateOfBirth) : undefined,
        cost: (leadData.cost || leadData.cost_nis) != null ? String(leadData.cost || leadData.cost_nis) : undefined,
        yearOfLicenseIssued: (leadData.year_of_license_issued || leadData.yearOfLicenseIssued || leadData.license_issue_year) != null ? String(leadData.year_of_license_issued || leadData.yearOfLicenseIssued || leadData.license_issue_year) : undefined,
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
