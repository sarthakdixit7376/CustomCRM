import prisma from '../config/prisma.js';
import type { PolicyExtraction } from '../services/documentClassificationService.js';

const toDate = (value: string | null | undefined): Date | undefined =>
  value ? new Date(value) : undefined;

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
    /** Structured fields Gemini pulled off the document, if any — see PolicyExtraction. */
    extraction?: PolicyExtraction | null;
  }) => {
    const { extraction, ...rest } = data;
    return prisma.policyDocument.create({
      data: {
        ...rest,
        extractedInsuranceCompany: extraction?.insuranceCompany ?? undefined,
        extractedPolicyNumber: extraction?.policyNumber ?? undefined,
        extractedPremiumAmount: extraction?.premiumAmount ?? undefined,
        extractedPremiumBasis: extraction?.premiumBasis ?? undefined,
        extractedStartDate: toDate(extraction?.startDate),
        extractedEndDate: toDate(extraction?.endDate),
        extractedClaimFreeYears: extraction?.claimFreeYears ?? undefined,
        extractionSnippets: extraction?.snippets && Object.keys(extraction.snippets).length > 0 ? extraction.snippets : undefined,
        extractionFlagged: extraction?.flagged ?? false,
      },
      include: {
        uploadedBy: { select: { id: true, name: true } },
      },
    });
  },

  /** Used by the backfill script to attach extraction results to a document uploaded before this feature shipped. */
  saveExtraction: async (id: string, extraction: PolicyExtraction) => {
    return prisma.policyDocument.update({
      where: { id },
      data: {
        extractedInsuranceCompany: extraction.insuranceCompany,
        extractedPolicyNumber: extraction.policyNumber,
        extractedPremiumAmount: extraction.premiumAmount,
        extractedPremiumBasis: extraction.premiumBasis,
        extractedStartDate: toDate(extraction.startDate) ?? null,
        extractedEndDate: toDate(extraction.endDate) ?? null,
        extractedClaimFreeYears: extraction.claimFreeYears,
        extractionSnippets: Object.keys(extraction.snippets).length > 0 ? extraction.snippets : undefined,
        extractionFlagged: extraction.flagged,
      },
    });
  },

  /** Documents that predate this feature (or failed extraction) and still need backfilling. */
  getUnextracted: async (limit: number) => {
    return prisma.policyDocument.findMany({
      where: {
        documentType: { in: ['Mandatory Policy Insurance', 'Third Party Policy Insurance', 'Third Party + Complimentary Policy Insurance'] },
        extractedInsuranceCompany: null,
        extractedPremiumAmount: null,
        ocrText: { not: null },
      },
      take: limit,
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
