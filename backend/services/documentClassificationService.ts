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

export interface ClassificationResult {
  documentType: DocumentType;
  extractedText: string;
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
                'Return the extracted text exactly as written in the document, in its original language(s) — do not translate it.',
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
          },
          required: ['documentType', 'extractedText'],
        },
      },
    });

    const parsed = JSON.parse(response.text ?? '{}');
    const documentType: DocumentType = DOCUMENT_TYPES.includes(parsed.documentType) ? parsed.documentType : 'Other';
    return { documentType, extractedText: typeof parsed.extractedText === 'string' ? parsed.extractedText : '' };
  } catch (error) {
    console.warn('Document classification failed, filing as "Other":', error);
    return { documentType: 'Other', extractedText: '' };
  }
}
