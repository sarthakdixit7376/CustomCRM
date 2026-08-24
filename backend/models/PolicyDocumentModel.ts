import prisma from '../config/prisma.js';

export const PolicyDocumentModel = {
  getDocumentsByPolicy: async (policyId: string) => {
    return prisma.policyDocument.findMany({
      where: { policyId },
      orderBy: { createdAt: 'desc' },
      include: {
        uploadedBy: { select: { id: true, name: true } },
      },
    });
  },

  /** All documents for a customer, across every policy plus any not tied to a specific policy. */
  getDocumentsByCustomer: async (customerId: string) => {
    return prisma.policyDocument.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
      include: {
        uploadedBy: { select: { id: true, name: true } },
        policy: { select: { id: true, policyNumber: true, policyType: true } },
      },
    });
  },

  getDocumentById: async (id: string) => {
    return prisma.policyDocument.findUnique({
      where: { id },
      include: {
        policy: { select: { id: true, customerId: true } },
        uploadedBy: { select: { id: true, name: true } },
      },
    });
  },

  createDocument: async (data: {
    policyId?: string | null;
    customerId: string;
    documentType: string;
    fileId: string;
    fileUrl: string;
    originalFilename?: string | null;
    ocrText?: string | null;
    uploadedById: string;
  }) => {
    return prisma.policyDocument.create({
      data,
      include: {
        uploadedBy: { select: { id: true, name: true } },
      },
    });
  },

  deleteDocument: async (id: string) => {
    try {
      await prisma.policyDocument.delete({ where: { id } });
      return true;
    } catch {
      return null;
    }
  },
};
