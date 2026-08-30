import { run, query } from '../db/database.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * DPDP Act 2023 Compliant Audit Logging Service
 */

// Ensure audit_logs table exists
const initAuditTable = async () => {
  try {
    await run(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        user_role TEXT,
        hospital_id TEXT,
        action TEXT NOT NULL,
        resource_type TEXT,
        resource_id TEXT,
        details TEXT,
        ip_address TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
  } catch (err) {
    console.warn('Audit table init notice:', err.message);
  }
};

initAuditTable();

export async function recordAuditLog({
  userId = 'ANONYMOUS',
  userRole = 'PATIENT',
  hospitalId = null,
  action,
  resourceType = 'GENERAL',
  resourceId = null,
  details = {},
  ipAddress = '127.0.0.1'
}) {
  try {
    const id = `aud-${uuidv4()}`;
    const detailsJson = typeof details === 'string' ? details : JSON.stringify(details);
    
    await run(
      `INSERT INTO audit_logs (id, user_id, user_role, hospital_id, action, resource_type, resource_id, details, ip_address)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, userId, userRole, hospitalId, action, resourceType, resourceId, detailsJson, ipAddress]
    );
    return id;
  } catch (err) {
    console.warn('Audit log write notice:', err.message);
    return null;
  }
}

export async function getAuditLogs(hospitalId, limit = 50) {
  try {
    return await query(
      `SELECT * FROM audit_logs WHERE hospital_id = ? OR hospital_id IS NULL ORDER BY created_at DESC LIMIT ?`,
      [hospitalId, limit]
    );
  } catch (err) {
    return [];
  }
}
