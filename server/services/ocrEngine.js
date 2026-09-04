import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { createWorker } from 'tesseract.js';

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

/**
 * MediMitra Genuine OCR Engine Service
 * 
 * Supports:
 * 1. Image OCR via Tesseract.js (PNG, JPG, JPEG, WebP, BMP, TIFF)
 * 2. PDF Document Stream Extraction via pdf-parse
 * 3. Pluggable Cloud OCR Provider abstraction (Google Vision / AWS Textract via env)
 */

class OcrEngineService {
  constructor() {
    this.provider = process.env.OCR_PROVIDER || 'TESSERACT';
    this.googleApiKey = process.env.GOOGLE_VISION_API_KEY || null;
    this.awsAccessKey = process.env.AWS_ACCESS_KEY_ID || null;
    this.tesseractWorker = null;
  }

  /**
   * Main entry point to extract text from a file buffer or disk path
   */
  async extractText(filePathOrBuffer, mimeType = '', originalName = '') {
    const isText = mimeType.includes('text') || originalName.toLowerCase().endsWith('.txt');
    const isPdf = mimeType.includes('pdf') || originalName.toLowerCase().endsWith('.pdf');

    if (isText) {
      const text = typeof filePathOrBuffer === 'string' ? fs.readFileSync(filePathOrBuffer, 'utf8') : filePathOrBuffer.toString('utf8');
      return {
        success: true,
        provider: 'TEXT_STREAM',
        rawText: text,
        confidence: 100,
        wordsCount: text.split(/\s+/).length
      };
    } else if (isPdf) {
      return this.extractFromPdf(filePathOrBuffer);
    } else {
      return this.extractFromImage(filePathOrBuffer);
    }
  }

  /**
   * Extract text from PDF documents using genuine pdf-parse
   */
  async extractFromPdf(filePathOrBuffer) {
    try {
      let dataBuffer;
      if (typeof filePathOrBuffer === 'string') {
        dataBuffer = fs.readFileSync(filePathOrBuffer);
      } else {
        dataBuffer = filePathOrBuffer;
      }

      let rawText = '';
      let numPages = 1;

      if (typeof pdfParse === 'function') {
        const pdfData = await pdfParse(dataBuffer);
        rawText = pdfData.text || '';
        numPages = pdfData.numpages || 1;
      } else if (pdfParse.PDFParse) {
        const parser = new pdfParse.PDFParse({ data: dataBuffer });
        const textResult = await parser.getText();
        rawText = textResult?.text || (typeof textResult === 'string' ? textResult : '');
        await parser.destroy();
      }

      if (!rawText.trim()) {
        return {
          success: true,
          provider: 'PDF_PARSE',
          rawText: '',
          confidence: null,
          pageCount: numPages,
          warning: 'PDF has no embedded text stream. If this is a scanned document, OCR on converted raster pages is required.'
        };
      }

      return {
        success: true,
        provider: 'PDF_TEXT_STREAM',
        rawText,
        confidence: null, // Digital text streams have direct character data, not OCR recognition confidence
        pageCount: numPages
      };
    } catch (err) {
      console.error('PDF text extraction error:', err.message);
      return {
        success: false,
        provider: 'PDF_PARSE',
        rawText: '',
        confidence: null,
        error: `Failed to extract text from PDF: ${err.message}`
      };
    }
  }

  /**
   * Extract text from image files using genuine Tesseract.js OCR engine
   */
  async extractFromImage(filePathOrBuffer) {
    // 1. If Google Cloud Vision or a handwriting-capable cloud provider is configured
    const handwritingProviderConfigured = (this.provider === 'GOOGLE_VISION' || process.env.ENABLE_HANDWRITING_OCR === 'true') && Boolean(this.googleApiKey);
    if (handwritingProviderConfigured) {
      try {
        return await this.extractWithGoogleVision(filePathOrBuffer);
      } catch (gErr) {
        console.warn('Google Vision OCR failed, falling back to local Tesseract:', gErr.message);
      }
    }

    // 2. Default Genuine Engine: Tesseract.js
    let worker = null;
    try {
      let imageInput;
      if (typeof filePathOrBuffer === 'string') {
        imageInput = filePathOrBuffer;
      } else {
        imageInput = filePathOrBuffer;
      }

      worker = await createWorker('eng');
      await worker.setParameters({
        tessedit_pageseg_mode: '3', // PSM.AUTO (Fully automatic page segmentation)
        preserve_interword_spaces: '1'
      });
      const ret = await worker.recognize(imageInput);
      await worker.terminate();

      const rawText = ret.data?.text || '';
      const rawConf = ret.data?.confidence;
      const confidence = typeof rawConf === 'number' && !isNaN(rawConf) && rawConf >= 0
        ? Math.round(rawConf)
        : null;

      return {
        success: true,
        provider: 'TESSERACT_JS',
        isHandwritingCapable: false,
        handwritingNotice: 'Handwritten text may require manual verification. Current OCR is optimized for clear printed text.',
        rawText,
        confidence,
        wordsCount: ret.data?.words ? ret.data.words.length : rawText.split(/\s+/).filter(Boolean).length
      };
    } catch (err) {
      if (worker) {
        try { await worker.terminate(); } catch {}
      }
      console.error('Tesseract OCR error:', err.message);
      return {
        success: false,
        provider: 'TESSERACT_JS',
        isHandwritingCapable: false,
        handwritingNotice: 'Handwritten text may require manual verification. Current OCR is optimized for clear printed text.',
        rawText: '',
        confidence: null,
        error: `OCR engine error: ${err.message}`
      };
    }
  }

  /**
   * Google Cloud Vision API integration (pluggable when GOOGLE_VISION_API_KEY is provided)
   */
  async extractWithGoogleVision(filePathOrBuffer) {
    if (!this.googleApiKey) {
      throw new Error('GOOGLE_VISION_API_KEY environment variable is not configured.');
    }

    let base64Image;
    if (typeof filePathOrBuffer === 'string') {
      base64Image = fs.readFileSync(filePathOrBuffer).toString('base64');
    } else {
      base64Image = filePathOrBuffer.toString('base64');
    }

    const response = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${this.googleApiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: [
          {
            image: { content: base64Image },
            features: [{ type: 'DOCUMENT_TEXT_DETECTION' }]
          }
        ]
      })
    });

    const data = await response.json();
    const textAnnotation = data.responses?.[0]?.fullTextAnnotation;

    if (!textAnnotation || !textAnnotation.text) {
      return {
        success: true,
        provider: 'GOOGLE_CLOUD_VISION',
        isHandwritingCapable: true,
        handwritingNotice: null,
        rawText: '',
        confidence: null,
        wordsCount: 0
      };
    }

    // Google Cloud Vision returns page-level confidence as a float (0.0 - 1.0) when calculated
    let genuineConfidence = null;
    const pageConfidence = data.responses?.[0]?.fullTextAnnotation?.pages?.[0]?.confidence;
    if (typeof pageConfidence === 'number' && !isNaN(pageConfidence) && pageConfidence > 0) {
      genuineConfidence = Math.round(pageConfidence * 100);
    }

    return {
      success: true,
      provider: 'GOOGLE_CLOUD_VISION',
      isHandwritingCapable: true,
      handwritingNotice: null,
      rawText: textAnnotation.text || '',
      confidence: genuineConfidence,
      wordsCount: textAnnotation.text.split(/\s+/).filter(Boolean).length
    };
  }
}

export const ocrEngine = new OcrEngineService();
