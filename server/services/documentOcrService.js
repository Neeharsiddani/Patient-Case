import { ocrEngine } from './ocrEngine.js';
import { extractClinicalEntities } from './clinicalEntityExtractor.js';

/**
 * MediMitra Genuine Document Processing & Clinical Entity Extraction Service
 * 
 * Pipeline:
 * File -> Real OCR Engine (Tesseract.js / pdf-parse) -> Real NLP Entity Extraction -> Timeline Structuring
 * 
 * Strict Directives:
 * 1. 0% Fake/Mock template output.
 * 2. 100% of raw OCR text is preserved and attached.
 * 3. Never invent missing dates, diagnoses, medicines, or reference ranges.
 * 4. Marked strictly as 'MACHINE_EXTRACTED_UNVERIFIED' until a physician confirms it.
 */
export const processMedicalDocument = async (fileMetadata, docTypeHint = null) => {
  if (!fileMetadata) {
    throw new Error('File metadata is required for OCR processing.');
  }

  const filePath = fileMetadata.path;
  const mimeType = fileMetadata.mimetype || '';
  const originalName = fileMetadata.originalname || '';

  // 1. Execute Genuine OCR on the uploaded image or PDF
  const ocrResult = await ocrEngine.extractText(filePath || fileMetadata.buffer, mimeType, originalName);

  const rawText = ocrResult.rawText || '';
  const ocrConfidence = typeof ocrResult.confidence === 'number' && !isNaN(ocrResult.confidence) ? ocrResult.confidence : null;
  const ocrProvider = ocrResult.provider || 'UNKNOWN';
  const isHandwritingCapable = Boolean(ocrResult.isHandwritingCapable);
  const handwritingNotice = ocrResult.handwritingNotice || null;

  // 2. Perform Real Clinical Entity Extraction from the actual OCR text
  const entities = extractClinicalEntities(rawText, docTypeHint);

  const requiresManualReview = (ocrConfidence != null && ocrConfidence < 75) || !entities.hasStructuredEntities || !entities.docDate || !isHandwritingCapable;

  const docDate = entities.docDate || null;
  const docYear = entities.docYear || null;
  const docTimestamp = entities.docTimestamp || 0;

  return {
    docType: entities.docType,
    category: entities.category,
    hospitalName: entities.hospitalName || null,
    doctorName: entities.doctorName || null,
    docDate: docDate,
    docYear: docYear,
    docTimestamp: docTimestamp,
    diagnosis: entities.diagnosis || null,
    ocrConfidence,
    ocrProvider,
    isHandwritingCapable,
    handwritingNotice,
    requiresManualReview,
    verificationStatus: 'MACHINE_EXTRACTED_UNVERIFIED',
    extractedData: {
      medicines: entities.medicines,
      investigations: entities.investigations,
      procedures: entities.procedures,
      rawOcrText: rawText,
      rawTextSummary: entities.rawTextSummary,
      hasStructuredEntities: entities.hasStructuredEntities,
      isHandwritingCapable,
      handwritingNotice,
      processedAt: new Date().toISOString()
    },
    timelineEntry: {
      year: docYear || null,
      date: docDate || 'Date not detected',
      timestamp: docTimestamp,
      title: `${entities.docType}${entities.hospitalName ? ` - ${entities.hospitalName}` : ''}`,
      category: entities.category,
      badgeColor: entities.category === 'Surgery' ? 'purple' : entities.category === 'Investigation' ? 'cyan' : 'emerald',
      summary: `${entities.rawTextSummary} [Status: Machine-Extracted, Pending Doctor Review]`,
      isMachineExtracted: true
    }
  };
};
