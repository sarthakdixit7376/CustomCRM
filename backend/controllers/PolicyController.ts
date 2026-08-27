import { Request, Response } from 'express';
import multer from 'multer';
import { PolicyModel } from '../models/PolicyModel.js';
import { PolicyDocumentModel } from '../models/PolicyDocumentModel.js';
import { CustomerModel } from '../models/CustomerModel.js';
import { ReminderModel } from '../models/ReminderModel.js';
import { uploadPolicyFile as uploadPolicyFileToCloudinary } from '../services/cloudinaryService.js';
import { classifyDocument, isPolicyDocumentType } from '../services/documentClassificationService.js';

export const policyFileUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

/** Cloudinary public_id may not contain '/', so strip anything that isn't alphanumeric/dash/underscore. */
const sanitizeForPublicId = (value: string) => value.replace(/[^a-zA-Z0-9_-]/g, '');

/** Fallback naming context (from an existing DB Policy row) used only when OCR couldn't read a value off the document. */
interface PolicyNamingContext {
  carNumber?: string | null;
  startDate?: Date | null;
  endDate?: Date | null;
}

const formatDateForFilename = (d: Date | null | undefined): string | null => (d ? d.toISOString().slice(0, 10) : null);

/**
 * OCRs + classifies an uploaded file, files it into Cloudinary under
 * policies/{customerId}/{documentType}/, and records a PolicyDocument row.
 * Shared by the policy-scoped and customer-scoped upload endpoints.
 */
const classifyAndUploadDocument = async (
  file: Express.Multer.File,
  customerId: string,
  policyId: string | null,
  uploadedById: string,
  policyContext?: PolicyNamingContext | null
) => {
  const { documentType, extractedText, extraction, carNumber, policyStartDate, policyEndDate } =
    await classifyDocument(file.buffer, file.mimetype);
  const sanitizedType = sanitizeForPublicId(documentType.replace(/\s+/g, '-'));

  // Folder is named after the customer's internal ID (stable even if the customer has no national ID set)
  // and the classified document type, so each document type lands in its own subfolder.
  const folder = `policies/${customerId}/${sanitizedType}`;
  // A customer can hold several documents of the same type, so the public_id must be unique per upload.
  const uniqueSuffix = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  const publicId = `${sanitizedType}_${uniqueSuffix}`;

  // Rename the file (keeping the original extension) so it reads clearly in both Cloudinary and the
  // document list, instead of the original upload name. When the document is classified as a policy
  // (Mandatory / Third Party / Third Party + Complimentary), the name is
  // "{insurance type} {car number} {start date} {end date}" — car number and dates are read directly
  // off the document by OCR, falling back to the linked Policy record's values only if OCR couldn't
  // read them. Non-policy documents (ID Card, Bank Details, etc.) just use the classified type.
  const extensionMatch = file.originalname.match(/\.[^.]+$/);
  const extension = extensionMatch ? extensionMatch[0] : '';
  const nameParts = isPolicyDocumentType(documentType)
    ? [
        documentType,
        carNumber ?? policyContext?.carNumber,
        policyStartDate ?? formatDateForFilename(policyContext?.startDate),
        policyEndDate ?? formatDateForFilename(policyContext?.endDate),
      ].filter(Boolean)
    : [documentType];
  const renamedFilename = `${nameParts.join(' ')}${extension}`;

  const { publicId: fileId, url: fileUrl } = await uploadPolicyFileToCloudinary(file.buffer, folder, publicId);
  return PolicyDocumentModel.createDocument({
    policyId,
    customerId,
    documentType,
    fileId,
    fileUrl,
    originalFilename: renamedFilename,
    ocrText: extractedText,
    uploadedById,
    extraction,
  });
};

export const getAllPolicies = async (req: Request, res: Response): Promise<void> => {
  try {
    const scopeAgentId = req.user!.role === 'ADMIN' ? undefined : req.user!.id;
    const policies = await PolicyModel.getAllPolicies(scopeAgentId);
    res.json(policies);
  } catch (error) {
    console.error('Error getting policies:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getPoliciesByCustomer = async (req: Request, res: Response): Promise<void> => {
  try {
    const customer = await CustomerModel.getCustomerById(req.params.customerId);
    if (!customer) {
      res.status(404).json({ error: 'Customer not found' });
      return;
    }
    if (req.user!.role !== 'ADMIN' && customer.agentId !== req.user!.id) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const policies = await PolicyModel.getPoliciesByCustomerId(req.params.customerId);
    res.json(policies);
  } catch (error) {
    console.error('Error getting policies:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const createPolicy = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.body.customerId) {
      res.status(400).json({ error: 'customerId is required' });
      return;
    }

    const customer = await CustomerModel.getCustomerById(req.body.customerId);
    if (!customer) {
      res.status(404).json({ error: 'Customer not found' });
      return;
    }
    if (req.user!.role !== 'ADMIN' && customer.agentId !== req.user!.id) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const newPolicy = await PolicyModel.createPolicy(req.body, req.body.customerId);

    if (newPolicy.endDate && newPolicy.customer) {
      await ReminderModel.upsertPolicyReminder(
        newPolicy.id,
        newPolicy.customerId,
        newPolicy.endDate,
        req.user!.id,
        newPolicy.policyNumber,
        newPolicy.customer.customerName
      ).catch((err) => console.error('Failed to auto-create policy reminder:', err));
    }

    res.status(201).json(newPolicy);
  } catch (error: any) {
    console.error('Error creating policy:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
};

export const updatePolicy = async (req: Request, res: Response): Promise<void> => {
  try {
    const existing = await PolicyModel.getPolicyById(req.params.id);
    if (!existing) {
      res.status(404).json({ error: 'Policy not found' });
      return;
    }
    if (req.user!.role !== 'ADMIN' && existing.customer?.agentId !== req.user!.id) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const updatedPolicy = await PolicyModel.updatePolicy(req.params.id, req.body);

    if (updatedPolicy.endDate && updatedPolicy.customer) {
      await ReminderModel.upsertPolicyReminder(
        updatedPolicy.id,
        updatedPolicy.customerId,
        updatedPolicy.endDate,
        req.user!.id,
        updatedPolicy.policyNumber,
        updatedPolicy.customer.customerName
      ).catch((err) => console.error('Failed to auto-update policy reminder:', err));
    }

    res.json(updatedPolicy);
  } catch (error) {
    console.error('Error updating policy:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const uploadPolicyFile = async (req: Request, res: Response): Promise<void> => {
  try {
    const existing = await PolicyModel.getPolicyById(req.params.id);
    if (!existing) {
      res.status(404).json({ error: 'Policy not found' });
      return;
    }
    if (req.user!.role !== 'ADMIN' && existing.customer?.agentId !== req.user!.id) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
    if (!req.file) {
      res.status(400).json({ error: 'file is required' });
      return;
    }

    const document = await classifyAndUploadDocument(req.file, existing.customerId, existing.id, req.user!.id, {
      carNumber: existing.carNumber,
      startDate: existing.startDate,
      endDate: existing.endDate,
    });
    res.status(201).json(document);
  } catch (error: any) {
    console.error('Error uploading policy file:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
};

export const getPolicyDocuments = async (req: Request, res: Response): Promise<void> => {
  try {
    const existing = await PolicyModel.getPolicyById(req.params.id);
    if (!existing) {
      res.status(404).json({ error: 'Policy not found' });
      return;
    }
    if (req.user!.role !== 'ADMIN' && existing.customer?.agentId !== req.user!.id) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const documents = await PolicyDocumentModel.getDocumentsByPolicy(req.params.id);
    res.json(documents);
  } catch (error) {
    console.error('Error getting policy documents:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const deletePolicyDocument = async (req: Request, res: Response): Promise<void> => {
  try {
    const existing = await PolicyDocumentModel.getDocumentById(req.params.id);
    if (!existing) {
      res.status(404).json({ error: 'Document not found' });
      return;
    }
    const customer = await CustomerModel.getCustomerById(existing.customerId);
    if (req.user!.role !== 'ADMIN' && customer?.agentId !== req.user!.id) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const result = await PolicyDocumentModel.deleteDocument(req.params.id);
    if (!result) {
      res.status(404).json({ error: 'Document not found' });
      return;
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting policy document:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getCustomerDocuments = async (req: Request, res: Response): Promise<void> => {
  try {
    const customer = await CustomerModel.getCustomerById(req.params.id);
    if (!customer) {
      res.status(404).json({ error: 'Customer not found' });
      return;
    }
    if (req.user!.role !== 'ADMIN' && customer.agentId !== req.user!.id) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const documents = await PolicyDocumentModel.getDocumentsByCustomer(req.params.id);
    res.json(documents);
  } catch (error) {
    console.error('Error getting customer documents:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const uploadCustomerDocument = async (req: Request, res: Response): Promise<void> => {
  try {
    const customer = await CustomerModel.getCustomerById(req.params.id);
    if (!customer) {
      res.status(404).json({ error: 'Customer not found' });
      return;
    }
    if (req.user!.role !== 'ADMIN' && customer.agentId !== req.user!.id) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
    if (!req.file) {
      res.status(400).json({ error: 'file is required' });
      return;
    }

    const document = await classifyAndUploadDocument(req.file, customer.id, null, req.user!.id);
    res.status(201).json(document);
  } catch (error: any) {
    console.error('Error uploading customer document:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
};

export const deletePolicy = async (req: Request, res: Response): Promise<void> => {
  try {
    const existing = await PolicyModel.getPolicyById(req.params.id);
    if (!existing) {
      res.status(404).json({ error: 'Policy not found' });
      return;
    }
    if (req.user!.role !== 'ADMIN' && existing.customer?.agentId !== req.user!.id) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const result = await PolicyModel.deletePolicy(req.params.id);
    if (!result) {
      res.status(404).json({ error: 'Policy not found' });
      return;
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting policy:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
