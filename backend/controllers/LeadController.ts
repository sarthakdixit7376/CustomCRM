import { Request, Response } from 'express';
import { LeadModel } from '../models/LeadModel.js';
import prisma from '../config/prisma.js';
import { generatePricingPdfBuffer } from '../services/pdfService.js';
import { uploadPdfBuffer } from '../services/cloudinaryService.js';
import { buildWhatsAppShareLink } from '../services/whatsappService.js';

export const getLeads = async (req: Request, res: Response): Promise<void> => {
  try {
    const scopeAgentId = req.user!.role === 'ADMIN' ? undefined : req.user!.id;
    const leads = await LeadModel.getLeads(scopeAgentId);
    res.json(leads);
  } catch (error) {
    console.error('Error reading leads:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * Cached live CMA comparisons, keyed by lead id — returns whatever the last manual
 * Re-price already fetched, instantly, without re-running the ~60s Puppeteer scrape.
 */
export const getLiveComparisons = async (req: Request, res: Response): Promise<void> => {
  try {
    const scopeAgentId = req.user!.role === 'ADMIN' ? undefined : req.user!.id;
    const comparisons = await LeadModel.getLiveComparisons(scopeAgentId);
    res.json(comparisons);
  } catch (error) {
    console.error('Error reading cached live comparisons:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const createLead = async (req: Request, res: Response): Promise<void> => {
  try {
    const raw = Array.isArray(req.body) ? req.body[0] : req.body;
    const age = Number(raw?.age);
    if (!raw?.age || Number.isNaN(age)) {
      res.status(400).json({ error: 'age is required and must be a number' });
      return;
    }

    const newLead = await LeadModel.createLead(req.body, req.user!.id);
    res.status(201).json(newLead);
  } catch (error) {
    console.error('Error writing lead:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const deleteLead = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const existing = await LeadModel.getLeadById(id);
    if (!existing) {
      res.status(404).json({ error: 'Lead not found' });
      return;
    }
    if (req.user!.role !== 'ADMIN' && existing.agentId !== req.user!.id) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const result = await LeadModel.deleteLead(id);
    if (!result) {
      res.status(404).json({ error: 'Lead not found' });
      return;
    }
    res.json({ success: true, id });
  } catch (error) {
    console.error('Error deleting lead:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getLeadById = async (req: Request, res: Response): Promise<void> => {
  try {
    const lead = await LeadModel.getLeadById(req.params.id);
    if (!lead) {
      res.status(404).json({ error: 'Lead not found' });
      return;
    }
    if (req.user!.role !== 'ADMIN' && lead.agentId !== req.user!.id) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
    res.json(lead);
  } catch (error) {
    console.error('Error reading lead:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const updateLeadAgent = async (req: Request, res: Response): Promise<void> => {
  try {
    const existing = await LeadModel.getLeadById(req.params.id);
    if (!existing) {
      res.status(404).json({ error: 'Lead not found' });
      return;
    }

    const { agentId } = req.body;
    if (!agentId) {
      res.status(400).json({ error: 'agentId is required' });
      return;
    }

    const agent = await prisma.user.findUnique({ where: { id: agentId } });
    if (!agent) {
      res.status(400).json({ error: 'Agent not found' });
      return;
    }

    const updated = await LeadModel.updateLeadAgent(req.params.id, agentId);
    res.json(updated);
  } catch (error) {
    console.error('Error updating lead agent:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * Auto-prices a lead's hova / tzad-gimel / makif columns from its driver and vehicle
 * data. Returns the saved lead plus the rating breakdown so the Quotes tab can show
 * the agent which factors drove each number.
 */
export const autoQuoteLead = async (req: Request, res: Response): Promise<void> => {
  try {
    const existing = await LeadModel.getLeadById(req.params.id);
    if (!existing) {
      res.status(404).json({ error: 'Lead not found' });
      return;
    }
    if (req.user!.role !== 'ADMIN' && existing.agentId !== req.user!.id) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const claimFreeYearsRaw = req.body?.claimFreeYears;
    const claimFreeYears = claimFreeYearsRaw != null && claimFreeYearsRaw !== ''
      ? Number(claimFreeYearsRaw)
      : undefined;
    if (claimFreeYears != null && Number.isNaN(claimFreeYears)) {
      res.status(400).json({ error: 'claimFreeYears must be a number' });
      return;
    }

    const result = await LeadModel.autoQuoteLead(req.params.id, {
      onlyMissing: Boolean(req.body?.onlyMissing),
      claimFreeYears,
      // Manual Re-price opts into live CMA; background auto-fill stays local/fast.
      live: Boolean(req.body?.live) || req.body?.onlyMissing === false,
    });
    if (!result) {
      res.status(404).json({ error: 'Lead not found' });
      return;
    }

    res.json({ lead: result.lead, quote: result.quote, liveComparison: result.liveComparison });
  } catch (error) {
    console.error('Error auto-quoting lead:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const updateLeadQuote = async (req: Request, res: Response): Promise<void> => {
  try {
    const existing = await LeadModel.getLeadById(req.params.id);
    if (!existing) {
      res.status(404).json({ error: 'Lead not found' });
      return;
    }
    if (req.user!.role !== 'ADMIN' && existing.agentId !== req.user!.id) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const { mandatoryPrice, thirdPartyPrice, complimentaryPrice, glassAndMoreSelected, complementaryVipSelected } = req.body;
    const fields = { mandatoryPrice, thirdPartyPrice, complimentaryPrice };
    const numericData: Record<string, number> = {};
    for (const [key, value] of Object.entries(fields)) {
      if (value === undefined) continue;
      const num = Number(value);
      if (Number.isNaN(num)) {
        res.status(400).json({ error: `${key} must be a number` });
        return;
      }
      numericData[key] = num;
    }

    const boolFields = { glassAndMoreSelected, complementaryVipSelected };
    const boolData: Record<string, boolean> = {};
    for (const [key, value] of Object.entries(boolFields)) {
      if (value === undefined) continue;
      boolData[key] = Boolean(value);
    }

    const updated = await LeadModel.updateLeadQuote(req.params.id, { ...numericData, ...boolData });
    res.json(updated);
  } catch (error) {
    console.error('Error updating lead quote:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const generatePricingPdf = async (req: Request, res: Response): Promise<void> => {
  try {
    const existing = await LeadModel.getLeadById(req.params.id);
    if (!existing) {
      res.status(404).json({ error: 'Lead not found' });
      return;
    }
    if (req.user!.role !== 'ADMIN' && existing.agentId !== req.user!.id) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const buffer = await generatePricingPdfBuffer(existing);
    const sanitizedPhone = (existing.phoneNumber || 'unknown').replace(/[^a-zA-Z0-9]/g, '');
    const now = new Date();
    const timestamp = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, '0'),
      String(now.getDate()).padStart(2, '0'),
    ].join('') + '_' + [
      String(now.getHours()).padStart(2, '0'),
      String(now.getMinutes()).padStart(2, '0'),
      String(now.getSeconds()).padStart(2, '0'),
    ].join('');
    const publicId = `${sanitizedPhone}_${timestamp}`;
    const pricingPdfUrl = await uploadPdfBuffer(buffer, publicId);
    await LeadModel.updateLeadPricingPdfUrl(existing.id, pricingPdfUrl);
    const whatsappLink = buildWhatsAppShareLink(existing.phoneNumber, pricingPdfUrl);

    res.json({ pricingPdfUrl, whatsappLink });
  } catch (error) {
    console.error('Error generating pricing PDF:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const convertLeadToCustomer = async (req: Request, res: Response): Promise<void> => {
  try {
    const existing = await LeadModel.getLeadById(req.params.id);
    if (!existing) {
      res.status(404).json({ error: 'Lead not found' });
      return;
    }
    if (req.user!.role !== 'ADMIN' && existing.agentId !== req.user!.id) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const { policyNumber, policyType, type, insuranceCompany, startDate, endDate, gender, agentName, purchaseType, email } = req.body;
    if (!policyNumber || !policyType || !insuranceCompany || !startDate || !endDate) {
      res.status(400).json({ error: 'policyNumber, policyType, insuranceCompany, startDate and endDate are required' });
      return;
    }
    if (policyType === 'Car' && !type) {
      res.status(400).json({ error: 'type is required when policyType is Car' });
      return;
    }

    const customer = await LeadModel.convertToCustomer(req.params.id, {
      policyNumber,
      policyType,
      type,
      insuranceCompany,
      startDate,
      endDate,
      gender,
      agentName,
      purchaseType,
      email,
    });

    res.status(201).json(customer);
  } catch (error) {
    console.error('Error converting lead to customer:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const updateLeadFlowStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const lead = await LeadModel.getLeadById(req.params.id);
    if (!lead) {
      res.status(404).json({ error: 'Lead not found' });
      return;
    }
    if (req.user!.role !== 'ADMIN' && lead.agentId !== req.user!.id) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
    
    const { leadFlowStatus, note } = req.body;
    if (!leadFlowStatus) {
      res.status(400).json({ error: 'leadFlowStatus is required' });
      return;
    }

    const updated = await LeadModel.updateLeadFlowStatus(req.params.id, leadFlowStatus, req.user!.id, note);
    res.json(updated);
  } catch (error) {
    console.error('Error updating lead flow status:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
