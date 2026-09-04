import express from 'express';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { run, get, query } from '../db/database.js';
import { upload } from '../middleware/upload.js';
import { processMedicalDocument } from '../services/documentOcrService.js';
import { recordAuditLog } from '../middleware/audit.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();

/**
 * POST /api/documents/upload
 * Secure document upload and automated OCR entity extraction
 */
router.post('/upload', upload.single('file'), async (req, res, next) => {
  try {
    const file = req.file;
    const { patientId = 'temp-patient', docTypeHint = null } = req.body;

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

    const safeOriginalName = file.sanitizedOriginalName || path.basename(file.originalname).replace(/[^a-zA-Z0-9._-]/g, '_');

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
      safeOriginalName,
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
        filename: safeOriginalName,
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
        originalFilename: safeOriginalName,
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
 * Doctor verifies and signs extracted OCR entities
 */
router.patch('/:id/verify', requireAuth, requireRole('DOCTOR', 'HOSPITAL_ADMIN', 'ADMIN'), async (req, res, next) => {
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

    // Verify hospital relationship through patient record
    const patient = await get('SELECT id, hospital_id FROM patients WHERE id = ?', [doc.patient_id]);
    if (patient && req.user.hospital_id && patient.hospital_id !== req.user.hospital_id) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden Access',
        message: 'You are not authorized to verify documents from another healthcare facility.'
      });
    }

    // Idempotent duplicate signing prevention
    if (doc.verification_status === 'CLINICIAN_VERIFIED' && !editedData && !diagnosis && !docDate) {
      return res.json({
        success: true,
        message: 'Medical document record is already verified and signed by clinician',
        document: {
          id,
          verificationStatus: 'CLINICIAN_VERIFIED',
          diagnosis: doc.diagnosis,
          docDate: doc.doc_date,
          verifiedByDoctorId: doc.verified_by_doctor_id,
          verifiedByDoctorName: doc.verified_by_doctor_name,
          verifiedAt: doc.verified_at,
          extractedData: JSON.parse(doc.extracted_data || '{}')
        }
      });
    }

    const currentExtracted = JSON.parse(doc.extracted_data || '{}');
    const updatedExtracted = editedData ? { ...currentExtracted, ...editedData } : currentExtracted;
    const updatedDiagnosis = diagnosis !== undefined ? diagnosis : doc.diagnosis;
    const updatedDate = docDate !== undefined ? docDate : doc.doc_date;
    const doctorId = req.user.id;
    const doctorName = req.user.full_name || req.user.username || 'Attending Physician';

    await run(`
      UPDATE documents
      SET verification_status = 'CLINICIAN_VERIFIED',
          verified_by_doctor_id = ?,
          verified_by_doctor_name = ?,
          verified_at = CURRENT_TIMESTAMP,
          diagnosis = ?,
          doc_date = ?,
          extracted_data = ?
      WHERE id = ?
    `, [doctorId, doctorName, updatedDiagnosis, updatedDate, JSON.stringify(updatedExtracted), id]);

    await recordAuditLog({
      userId: doctorId,
      userRole: req.user.role,
      hospitalId: req.user.hospital_id,
      action: 'DOCUMENT_OCR_VERIFIED_AND_SIGNED',
      resourceType: 'DOCUMENT',
      resourceId: id,
      details: {
        documentId: id,
        patientId: doc.patient_id,
        doctorId,
        doctorName,
        diagnosis: updatedDiagnosis
      },
      ipAddress: req.ip || '127.0.0.1'
    });

    res.json({
      success: true,
      message: 'Medical document record verified and signed by clinician',
      document: {
        id,
        verificationStatus: 'CLINICIAN_VERIFIED',
        diagnosis: updatedDiagnosis,
        docDate: updatedDate,
        verifiedByDoctorId: doctorId,
        verifiedByDoctorName: doctorName,
        verifiedAt: new Date().toISOString(),
        extractedData: updatedExtracted
      }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/documents/patient/:patientId
 * Get all documents for a patient (hospital scoped)
 */
router.get('/patient/:patientId', requireAuth, requireRole('DOCTOR', 'HOSPITAL_ADMIN', 'ADMIN'), async (req, res, next) => {
  try {
    const { patientId } = req.params;

    const patient = await get('SELECT id, hospital_id FROM patients WHERE id = ?', [patientId]);
    if (!patient) {
      return res.status(404).json({
        success: false,
        error: 'Patient Not Found'
      });
    }

    if (req.user.hospital_id && patient.hospital_id !== req.user.hospital_id) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden Access',
        message: 'You are not authorized to view documents for a patient from another healthcare facility.'
      });
    }

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
        docYear: d.doc_year,
        diagnosis: d.diagnosis,
        ocrConfidence: d.ocr_confidence,
        rawOcrText: d.raw_ocr_text,
        extractedData: JSON.parse(d.extracted_data || '{}'),
        verificationStatus: d.verification_status,
        verifiedByDoctorId: d.verified_by_doctor_id,
        verifiedByDoctorName: d.verified_by_doctor_name,
        verifiedAt: d.verified_at,
        uploadedAt: d.uploaded_at
      }))
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/documents/download/:id
 * Securely stream document file to authorized clients with hospital verification
 */
router.get('/download/:id', requireAuth, requireRole('DOCTOR', 'HOSPITAL_ADMIN', 'ADMIN'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const document = await get('SELECT * FROM documents WHERE id = ?', [id]);
    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document Not Found'
      });
    }

    // Verify hospital relationship through patient record
    const patient = await get('SELECT id, hospital_id FROM patients WHERE id = ?', [document.patient_id]);
    if (patient && req.user.hospital_id && patient.hospital_id !== req.user.hospital_id) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden Access',
        message: 'You are not authorized to download medical documents belonging to another healthcare facility.'
      });
    }

    const uploadDir = process.env.UPLOAD_DIR || path.resolve(path.dirname(document.file_path));
    const resolvedPath = path.resolve(document.file_path);
    const resolvedUploadDir = path.resolve(uploadDir);

    // Strict path traversal containment check
    if (!resolvedPath.startsWith(resolvedUploadDir)) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden Access',
        message: 'Path traversal attempt detected and blocked.'
      });
    }

    if (!fs.existsSync(resolvedPath)) {
      return res.status(404).json({
        success: false,
        error: 'File Missing on Disk'
      });
    }

    const safeFilename = path.basename(document.original_filename).replace(/[^a-zA-Z0-9._-]/g, '_');

    await recordAuditLog({
      userId: req.user.id,
      userRole: req.user.role,
      hospitalId: req.user.hospital_id,
      action: 'DOCUMENT_VIEWED',
      resourceType: 'DOCUMENT',
      resourceId: id,
      details: { originalFilename: safeFilename },
      ipAddress: req.ip || '127.0.0.1'
    });

    res.setHeader('Content-Type', document.mime_type);
    res.setHeader('Content-Disposition', `inline; filename="${safeFilename}"`);
    const fileStream = fs.createReadStream(resolvedPath);
    fileStream.pipe(res);
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/documents/:id
 * Delete a medical document record with strict hospital authorization
 */
router.delete('/:id', requireAuth, requireRole('DOCTOR', 'HOSPITAL_ADMIN', 'ADMIN'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const document = await get('SELECT * FROM documents WHERE id = ?', [id]);
    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document Not Found'
      });
    }

    // Verify hospital relationship through patient record
    const patient = await get('SELECT id, hospital_id FROM patients WHERE id = ?', [document.patient_id]);
    if (patient && req.user.hospital_id && patient.hospital_id !== req.user.hospital_id) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden Access',
        message: 'You are not authorized to delete documents belonging to another healthcare facility.'
      });
    }

    // Safely remove file from disk if present in upload directory
    if (document.file_path && fs.existsSync(document.file_path)) {
      try {
        fs.unlinkSync(document.file_path);
      } catch (unlinkErr) {
        console.warn('Document unlink warning:', unlinkErr.message);
      }
    }

    // Delete record from database
    await run('DELETE FROM documents WHERE id = ?', [id]);

    await recordAuditLog({
      userId: req.user.id,
      userRole: req.user.role,
      hospitalId: req.user.hospital_id,
      action: 'DOCUMENT_DELETED',
      resourceType: 'DOCUMENT',
      resourceId: id,
      details: { originalFilename: document.original_filename, patientId: document.patient_id },
      ipAddress: req.ip || '127.0.0.1'
    });

    res.json({
      success: true,
      message: 'Medical document deleted successfully'
    });
  } catch (err) {
    next(err);
  }
});

export default router;
