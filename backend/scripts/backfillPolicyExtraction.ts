/**
 * One-off backfill: re-runs structured extraction over policy documents that were
 * OCR'd before this feature shipped (or whose extraction attempt found nothing).
 *
 * Text-only — reuses the `ocrText` already stored on each PolicyDocument, so it
 * never re-downloads the file or re-sends an image/PDF to Gemini. Cheap enough to
 * run against the whole history in one pass.
 *
 * Usage:
 *   npm run backfill:extraction [-- --limit=500]
 */
import 'dotenv/config';
import prisma from '../config/prisma.js';
import { extractFromText, type DocumentType } from '../services/documentClassificationService.js';
import { PolicyDocumentModel } from '../models/PolicyDocumentModel.js';

const limitArg = process.argv.find((a) => a.startsWith('--limit='));
const LIMIT = limitArg ? Number(limitArg.split('=')[1]) : 500;

async function main() {
  const documents = await PolicyDocumentModel.getUnextracted(LIMIT);
  console.log(`Found ${documents.length} policy document(s) to backfill.`);

  let extracted = 0;
  let flagged = 0;
  let empty = 0;

  for (const doc of documents) {
    const result = await extractFromText(doc.documentType as DocumentType, doc.ocrText ?? '');
    if (!result) {
      empty++;
      continue;
    }

    await PolicyDocumentModel.saveExtraction(doc.id, result);
    extracted++;
    if (result.flagged) flagged++;

    console.log(
      `  ${doc.id}  ${doc.documentType}  ->  ${result.insuranceCompany ?? '—'} / ₪${result.premiumAmount ?? '—'}` +
        (result.flagged ? '  [FLAGGED: outside sanity range]' : '')
    );
  }

  console.log(`\nDone. Extracted: ${extracted}, nothing found: ${empty}, flagged for review: ${flagged}.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
