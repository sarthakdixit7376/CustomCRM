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

const POLICY_DOCUMENT_TYPES: DocumentType[] = [
  'Mandatory Policy Insurance',
  'Third Party Policy Insurance',
  'Third Party + Complimentary Policy Insurance',
];

export const isPolicyDocumentType = (documentType: DocumentType): boolean =>
  (POLICY_DOCUMENT_TYPES as string[]).includes(documentType);

export interface ClassificationResult {
  documentType: DocumentType;
  extractedText: string;
  /** Only populated for policy document types — read directly off the document, not looked up. */
  carNumber: string | null;
  policyStartDate: string | null; // YYYY-MM-DD
  policyEndDate: string | null; // YYYY-MM-DD
}

const MODEL = 'gemini-3.7-flash';

/** OCRs and classifies an uploaded policy document (image or PDF) in a single Gemini call. */
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
                'Return the extracted text exactly as written in the document, in its original language(s) — do not translate it.\n' +
                'If (and only if) the document is one of the three policy insurance types above, also read off the document itself ' +
                '(do not guess or infer): the insured vehicle\'s license plate / car number (מספר רכב), the policy start date ' +
                '(תחילת ביטוח / תוקף מ), and the policy end date (סיום ביטוח / תוקף עד). Return each date normalized to YYYY-MM-DD ' +
                '(the document may show DD/MM/YYYY or other formats — convert it). If a value is not present or unreadable, return null ' +
                'for it rather than guessing. For any non-policy document type, return null for all three of these fields.',
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
            carNumber: { type: Type.STRING, nullable: true },
            policyStartDate: { type: Type.STRING, nullable: true },
            policyEndDate: { type: Type.STRING, nullable: true },
          },
          required: ['documentType', 'extractedText'],
        },
      },
    });

    const parsed = JSON.parse(response.text ?? '{}');
    const documentType: DocumentType = DOCUMENT_TYPES.includes(parsed.documentType) ? parsed.documentType : 'Other';
    const isPolicy = isPolicyDocumentType(documentType);
    return {
      documentType,
      extractedText: typeof parsed.extractedText === 'string' ? parsed.extractedText : '',
      carNumber: isPolicy && typeof parsed.carNumber === 'string' && parsed.carNumber.trim() ? parsed.carNumber.trim() : null,
      policyStartDate: isPolicy && typeof parsed.policyStartDate === 'string' && parsed.policyStartDate.trim() ? parsed.policyStartDate.trim() : null,
      policyEndDate: isPolicy && typeof parsed.policyEndDate === 'string' && parsed.policyEndDate.trim() ? parsed.policyEndDate.trim() : null,
    };
  } catch (error) {
    console.warn('Document classification failed, filing as "Other":', error);
    return { documentType: 'Other', extractedText: '', carNumber: null, policyStartDate: null, policyEndDate: null };
  }
}
