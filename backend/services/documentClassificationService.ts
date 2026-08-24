import { GoogleGenAI, Type } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

/** First-draft taxonomy — tune once real sample documents are available. */
export const DOCUMENT_TYPES = [
  'ID Card',
  "Driver's License",
  'Vehicle Registration',
  'Vehicle Test Certificate',
  'Insurance Policy Document',
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
                'This document is from an Israeli insurance CRM and is written in Hebrew. ' +
                'Read it and classify what kind of document it is. ' +
                'Return the extracted text exactly as written in the document — do not translate it out of Hebrew.',
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
