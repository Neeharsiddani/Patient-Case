import express from 'express';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { run, get, query } from '../db/database.js';
import { upload } from '../middleware/upload.js';
import { processMedicalDocument } from '../services/documentOcrService.js';
import { recordAuditLog } from '../middleware/audit.js';

const router = express.Router();

/**
 * POST /api/documents/upload
 * Secure document upload and automated OCR entity extraction
 */
router.post('/upload', upload.single('file'), async (req, res, next) => {
  try {
    const file = req.file;
    const { patientId = 'temp-patient', docTypeHint = 'prescription' } = req.body;

    if (!file) {
      return res.status(400).json({
        success: false,
        error: 'No File Provided',
        message: 'Please select a valid medical document file (PDF, JPG, PNG).'
      });
    }

    // 1. Process Document through OCR & Medical Entity Extraction Pipeline
    const extractionResult = await processMedicalDocument(file, docTypeHint);

    const docId = uuidv4();

    // 2. Persist Document Record in Database
    await run(`
      INSERT INTO documents (
        id, patient_id, original_filename, stored_filename, file_path,
        mime_type, file_size, doc_type, doc_type_name, doc_date, doc_year,
        hospital_name, doctor_name, diagnosis, ocr_confidence, raw_ocr_text, extracted_data, verification_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      docId,
      patientId,
      file.originalname,
      file.filename,
      file.path,
      file.mimetype,
      file.size,
      extractionResult.docType,
      extractionResult.docType,
      extractionResult.docDate,
      extractionResult.docYear,
      extractionResult.hospitalName,
      extractionResult.doctorName,
      extractionResult.diagnosis,
      extractionResult.ocrConfidence,
      extractionResult.extractedData.rawOcrText || '',
      JSON.stringify(extractionResult.extractedData),
      extractionResult.verificationStatus
    ]);

    // 3. Record Audit Log
    await recordAuditLog({
      userId: req.user ? req.user.id : 'PATIENT_KIOSK',
      userRole: 'PATIENT',
      action: 'DOCUMENT_UPLOADED_AND_OCR_PROCESSED',
      resourceType: 'DOCUMENT',
      resourceId: docId,
      details: {
        filename: file.originalname,
        docType: extractionResult.docType,
        ocrConfidence: extractionResult.ocrConfidence,
        requiresReview: extractionResult.requiresManualReview
      },
      ipAddress: req.ip || '127.0.0.1'
    });

    res.status(201).json({
      success: true,
      message: 'Medical document uploaded and processed with real OCR engine successfully',
      document: {
        id: docId,
        patientId,
        originalFilename: file.originalname,
        storedFilename: file.filename,
        docType: extractionResult.docType,
        category: extractionResult.category,
        hospitalName: extractionResult.hospitalName,
        doctorName: extractionResult.doctorName,
        docDate: extractionResult.docDate,
        docYear: extractionResult.docYear,
        diagnosis: extractionResult.diagnosis,
        ocrConfidence: extractionResult.ocrConfidence,
        ocrProvider: extractionResult.ocrProvider,
        requiresManualReview: extractionResult.requiresManualReview,
        rawOcrText: extractionResult.extractedData.rawOcrText,
        extractedData: extractionResult.extractedData,
        timelineEntry: extractionResult.timelineEntry,
        verificationStatus: extractionResult.verificationStatus
      }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/documents/:id/verify
 * Doctor verifies and optionally edits extracted OCR entities
 */
router.patch('/:id/verify', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { editedData, diagnosis, docDate } = req.body;

    const doc = await get('SELECT * FROM documents WHERE id = ?', [id]);
    if (!doc) {
      return res.status(404).json({
        success: false,
        error: 'Document Not Found',
        message: `No document found with ID ${id}.`
      });
    }

    const currentExtracted = JSON.parse(doc.extracted_data || '{}');
    const updatedExtracted = editedData ? { ...currentExtracted, ...editedData } : currentExtracted;
    const updatedDiagnosis = diagnosis || doc.diagnosis;
    const updatedDate = docDate || doc.doc_date;

    await run(`
      UPDATE documents
      SET verification_status = 'VERIFIED_BY_CLINICIAN',
          diagnosis = ?,
          doc_date = ?,
          extracted_data = ?
      WHERE id = ?
    `, [updatedDiagnosis, updatedDate, JSON.stringify(updatedExtracted), id]);

    await recordAuditLog({
      userId: req.user ? req.user.id : 'ATTENDING_DOCTOR',
      userRole: 'DOCTOR',
      action: 'DOCUMENT_OCR_VERIFIED_BY_CLINICIAN',
      resourceType: 'DOCUMENT',
      resourceId: id,
      details: { documentId: id, diagnosis: updatedDiagnosis },
      ipAddress: req.ip || '127.0.0.1'
    });

    res.json({
      success: true,
      message: 'Medical document record verified and signed by clinician',
      document: {
        id,
        verificationStatus: 'VERIFIED_BY_CLINICIAN',
        diagnosis: updatedDiagnosis,
        docDate: updatedDate,
        extractedData: updatedExtracted
      }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/documents/patient/:patientId
 * Get all documents for a patient
 */
router.get('/patient/:patientId', async (req, res, next) => {
  try {
    const { patientId } = req.params;
    const documents = await query('SELECT * FROM documents WHERE patient_id = ? ORDER BY uploaded_at DESC', [patientId]);
    res.json({
      success: true,
      count: documents.length,
      documents: documents.map(d => ({
        id: d.id,
        originalFilename: d.original_filename,
        storedFilename: d.stored_filename,
        docType: d.doc_type,
        hospitalName: d.hospital_name,
        doctorName: d.doctor_name,
        docDate: d.doc_date,
        diagnosis: d.diagnosis,
        ocrConfidence: d.ocr_confidence,
        rawOcrText: d.raw_ocr_text,
        extractedData: JSON.parse(d.extracted_data || '{}'),
        verificationStatus: d.verification_status,
        uploadedAt: d.uploaded_at
      }))
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/documents/download/:id
 * Securely stream document file to authorized clients
 */
router.get('/download/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const document = await get('SELECT * FROM documents WHERE id = ?', [id]);
    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document Not Found'
      });
    }

    if (!fs.existsSync(document.file_path)) {
      return res.status(404).json({
        success: false,
        error: 'File Missing on Disk'
      });
    }

    await recordAuditLog({
      userId: req.user ? req.user.id : 'KIOSK_VIEWER',
      userRole: req.user ? req.user.role : 'PATIENT',
      action: 'DOCUMENT_VIEWED',
      resourceType: 'DOCUMENT',
      resourceId: id,
      details: { originalFilename: document.original_filename },
      ipAddress: req.ip || '127.0.0.1'
    });

    res.setHeader('Content-Type', document.mime_type);
    res.setHeader('Content-Disposition', `inline; filename="${document.original_filename}"`);
    const fileStream = fs.createReadStream(document.file_path);
    fileStream.pipe(res);
  } catch (err) {
    next(err);
  }
});

export default router;
