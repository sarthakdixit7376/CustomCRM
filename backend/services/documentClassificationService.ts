import { GoogleGenAI, Type } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

/** First-draft taxonomy — tune once real sample documents are available. */
export const DOCUMENT_TYPES = [
  'ID Card',
  "Driver's License",
  'Vehicle Registration',
  'Vehicle Test Certificate',
  'Mandatory Policy Insurance',
  'Third Party Policy Insurance',
  'Third Party + Complimentary Policy Insurance',
  'Good Faith Form',
  'Health Fund Form',
  'Bank Details',
  'Other',
] as const;

export type DocumentType = (typeof DOCUMENT_TYPES)[number];

/** The document types that actually carry policy/premium data worth extracting. */
const POLICY_DOCUMENT_TYPES: readonly DocumentType[] = [
  'Mandatory Policy Insurance',
  'Third Party Policy Insurance',
  'Third Party + Complimentary Policy Insurance',
];

export type PremiumBasis = 'ANNUAL' | 'MONTHLY';

/**
 * Structured fields pulled off a policy document. Every value is a PROPOSAL — the
 * caller must never write it straight into a Policy/Lead record without a human
 * confirming, because a misread field (most dangerously: monthly premium mistaken
 * for annual) would otherwise silently corrupt pricing.
 */
export interface PolicyExtraction {
  insuranceCompany: string | null;
  policyNumber: string | null;
  /** Always normalized to an annual figure — see `premiumBasis` for what the document actually printed. */
  premiumAmount: number | null;
  /** The unit the source document quoted the premium in, before normalization. */
  premiumBasis: PremiumBasis | null;
  startDate: string | null; // ISO yyyy-mm-dd
  endDate: string | null; // ISO yyyy-mm-dd
  /** Shin-nun (claim-free) years, if stated on the document. */
  claimFreeYears: number | null;
  /** Verbatim source text per field, so an agent can verify without reopening the file. */
  snippets: Record<string, string>;
  /** True when premiumAmount fell outside the sanity range and needs manual review. */
  flagged: boolean;
}

export interface ClassificationResult {
  documentType: DocumentType;
  extractedText: string;
  extraction: PolicyExtraction | null;
}

const MODEL = 'gemini-3.7-flash';

/**
 * A monthly-read-as-annual mistake is off by ~12x and would otherwise look like a
 * perfectly plausible price. Anything outside this band gets flagged for review
 * instead of trusted — these bounds are intentionally wide (covers hova, tzad
 * gimel, and makif together) since this is a sanity net, not a rating rule.
 */
const ANNUAL_PREMIUM_SANITY_RANGE = { min: 300, max: 20000 };

const EMPTY_EXTRACTION: PolicyExtraction = {
  insuranceCompany: null,
  policyNumber: null,
  premiumAmount: null,
  premiumBasis: null,
  startDate: null,
  endDate: null,
  claimFreeYears: null,
  snippets: {},
  flagged: false,
};

const extractionSchema = {
  type: Type.OBJECT,
  properties: {
    insuranceCompany: { type: Type.STRING, nullable: true },
    policyNumber: { type: Type.STRING, nullable: true },
    premiumAmount: { type: Type.NUMBER, nullable: true },
    premiumBasis: { type: Type.STRING, enum: ['ANNUAL', 'MONTHLY'], nullable: true },
    startDate: { type: Type.STRING, nullable: true, description: 'ISO yyyy-mm-dd' },
    endDate: { type: Type.STRING, nullable: true, description: 'ISO yyyy-mm-dd' },
    claimFreeYears: { type: Type.INTEGER, nullable: true },
    snippets: {
      type: Type.OBJECT,
      nullable: true,
      properties: {
        insuranceCompany: { type: Type.STRING, nullable: true },
        policyNumber: { type: Type.STRING, nullable: true },
        premiumAmount: { type: Type.STRING, nullable: true },
        startDate: { type: Type.STRING, nullable: true },
        endDate: { type: Type.STRING, nullable: true },
        claimFreeYears: { type: Type.STRING, nullable: true },
      },
    },
  },
} as const;

const EXTRACTION_PROMPT =
  'This document was classified as an Israeli car insurance policy certificate. Also extract these fields ' +
  'if present anywhere in the document (tables, stamped boxes, and prose all count):\n' +
  '- insuranceCompany: the insurer\'s name, in the language/script the document uses\n' +
  '- policyNumber: the policy/certificate number (מספר פוליסה)\n' +
  '- premiumAmount + premiumBasis: the premium the document actually states, and whether that figure is ' +
  'per YEAR or per MONTH ("פרמיה שנתית" = ANNUAL, "פרמיה חודשית" / תשלום חודשי = MONTHLY). ' +
  'Report premiumAmount exactly as printed, in the basis it was printed in — do NOT convert it yourself.\n' +
  '- startDate / endDate: the policy period (תחילת תוקף / תום תוקף), as ISO yyyy-mm-dd\n' +
  '- claimFreeYears: years with no claims / "שנים ללא תביעות" / no-claims / shin-nun years, as a plain integer ' +
  '(e.g. "5 שנים ללא תביעות" -> 5)\n' +
  'For every field you fill in, also copy the exact verbatim source text you read it from into the matching ' +
  'key of `snippets`, in the document\'s original language. Leave a field null (and omit its snippet) if it ' +
  'is not clearly present — never guess or infer a value that is not actually printed on the document.';

/** Converts a stated premium to an annual figure so downstream consumers get one consistent unit. */
const normalizeToAnnual = (amount: number, basis: PremiumBasis | null): number =>
  basis === 'MONTHLY' ? amount * 12 : amount;

const parseIsoDate = (value: unknown): string | null => {
  if (typeof value !== 'string' || value.trim() === '') return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : value;
};

const parseExtraction = (raw: any): PolicyExtraction => {
  if (!raw || typeof raw !== 'object') return EMPTY_EXTRACTION;

  const rawAmount = typeof raw.premiumAmount === 'number' && Number.isFinite(raw.premiumAmount) ? raw.premiumAmount : null;
  const premiumBasis: PremiumBasis | null = raw.premiumBasis === 'ANNUAL' || raw.premiumBasis === 'MONTHLY' ? raw.premiumBasis : null;
  const annualAmount = rawAmount != null ? normalizeToAnnual(rawAmount, premiumBasis) : null;
  const flagged =
    annualAmount != null &&
    (annualAmount < ANNUAL_PREMIUM_SANITY_RANGE.min || annualAmount > ANNUAL_PREMIUM_SANITY_RANGE.max);

  const snippetsRaw = raw.snippets && typeof raw.snippets === 'object' ? raw.snippets : {};
  const snippets: Record<string, string> = {};
  for (const [key, value] of Object.entries(snippetsRaw)) {
    if (typeof value === 'string' && value.trim() !== '') snippets[key] = value;
  }

  return {
    insuranceCompany: typeof raw.insuranceCompany === 'string' && raw.insuranceCompany.trim() ? raw.insuranceCompany : null,
    policyNumber: typeof raw.policyNumber === 'string' && raw.policyNumber.trim() ? raw.policyNumber : null,
    premiumAmount: annualAmount,
    premiumBasis,
    startDate: parseIsoDate(raw.startDate),
    endDate: parseIsoDate(raw.endDate),
    claimFreeYears:
      typeof raw.claimFreeYears === 'number' && Number.isInteger(raw.claimFreeYears) && raw.claimFreeYears >= 0
        ? raw.claimFreeYears
        : null,
    snippets,
    flagged,
  };
};

/** OCRs, classifies, and (for policy documents) extracts structured fields — all in one Gemini call. */
export async function classifyDocument(buffer: Buffer, mimeType: string): Promise<ClassificationResult> {
  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: [
        {
          role: 'user',
          parts: [
            { inlineData: { data: buffer.toString('base64'), mimeType } },
            {
              text:
                'This is a document from an Israeli insurance CRM. It is commonly in Hebrew, but may be in English or Arabic, ' +
                'or a mix of these (some insurers issue trilingual certificates). ' +
                'Read the whole document, including short field labels/values inside tables or stamped boxes (not just prose paragraphs), ' +
                'and classify what kind of document it is. ' +
                'For car insurance policy documents specifically, use these rules based on the coverage terminology found ANYWHERE in the document, ' +
                'and return the category name exactly as given here — do not paraphrase or translate it:\n' +
                '- Mentions "ביטוח חובה", "Bituach Chova", "compulsory insurance", or "mandatory insurance" -> "Mandatory Policy Insurance"\n' +
                '- Mentions "TP", "Third Party", or "צד ג׳" coverage ALONE, with no comprehensive/complementary/supplementary add-on -> "Third Party Policy Insurance"\n' +
                '- Mentions "TP+Comp", "Comp+TP", "TP + Comp", "Comp + TP" (in either word order, with or without spaces), ' +
                '"צד ג + מקיף", "Third Party Liability & Comprehensive", "Third Party (...) and Comprehensive", ' +
                'or any other combination of third-party coverage plus comprehensive/complementary/supplementary add-on, ' +
                'in any word order or language -> "Third Party + Complimentary Policy Insurance"\n' +
                'Return the extracted text exactly as written in the document, in its original language(s) — do not translate it.\n\n' +
                `If the document is one of those three policy categories, additionally: ${EXTRACTION_PROMPT}\n` +
                'If it is NOT one of those three categories, leave every field in `extraction` null.',
            },
          ],
        },
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            documentType: { type: Type.STRING, enum: [...DOCUMENT_TYPES] },
            extractedText: { type: Type.STRING },
            extraction: extractionSchema,
          },
          required: ['documentType', 'extractedText'],
        },
      },
    });

    const parsed = JSON.parse(response.text ?? '{}');
    const documentType: DocumentType = DOCUMENT_TYPES.includes(parsed.documentType) ? parsed.documentType : 'Other';
    const extractedText = typeof parsed.extractedText === 'string' ? parsed.extractedText : '';
    const extraction = POLICY_DOCUMENT_TYPES.includes(documentType) ? parseExtraction(parsed.extraction) : null;

    return { documentType, extractedText, extraction };
  } catch (error) {
    console.warn('Document classification failed, filing as "Other":', error);
    return { documentType: 'Other', extractedText: '', extraction: null };
  }
}

/**
 * Text-only re-extraction for documents that were already OCR'd before this feature
 * shipped — used by the backfill script so historical uploads don't need to be
 * re-downloaded and re-sent to Gemini as images/PDFs.
 */
export async function extractFromText(documentType: DocumentType, extractedText: string): Promise<PolicyExtraction | null> {
  if (!POLICY_DOCUMENT_TYPES.includes(documentType) || !extractedText.trim()) return null;

  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: [
        {
          role: 'user',
          parts: [
            {
              text:
                'The following is OCR text already extracted from an Israeli car insurance policy document ' +
                `(classified as "${documentType}"). ${EXTRACTION_PROMPT}\n\n--- OCR TEXT ---\n${extractedText}`,
            },
          ],
        },
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: extractionSchema,
      },
    });

    return parseExtraction(JSON.parse(response.text ?? '{}'));
  } catch (error) {
    console.warn('Text-only extraction failed:', error);
    return null;
  }
}
