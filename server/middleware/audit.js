import { v4 as uuidv4 } from 'uuid';
import { run } from '../db/database.js';

/**
 * Helper to record audit log events in the immutable audit_logs database table.
 */
export const recordAuditLog = async ({
  userId = 'ANONYMOUS',
  userRole = 'KIOSK_GUEST',
  action,
  resourceType,
  resourceId = null,
  details = {},
  ipAddress = '127.0.0.1'
}) => {
  try {
    const id = uuidv4();
    await run(`
      INSERT INTO audit_logs (id, user_id, user_role, action, resource_type, resource_id, details, ip_address)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id,
      userId,
      userRole,
      action,
      resourceType,
      resourceId,
      typeof details === 'string' ? details : JSON.stringify(details),
      ipAddress
    ]);
  } catch (err) {
    // Audit logging failure should be logged to stderr without interrupting critical patient care
    console.error('⚠️ Audit Logging Error:', err.message);
  }
};

/**
 * Express middleware for capturing request audit metadata
 */
export const auditMiddleware = (actionName, resourceType) => {
  return (req, res, next) => {
    // Intercept response finish to log the outcome
    res.on('finish', () => {
      if (res.statusCode < 400) {
        recordAuditLog({
          userId: req.user ? req.user.id : 'KIOSK_SESSION',
          userRole: req.user ? req.user.role : 'PATIENT_KIOSK',
          action: actionName,
          resourceType: resourceType,
          resourceId: req.params.id || req.params.patientId || req.body.patientId || null,
          details: {
            method: req.method,
            path: req.originalUrl,
            status: res.statusCode
          },
          ipAddress: req.ip || req.connection.remoteAddress || '127.0.0.1'
        });
      }
    });
    next();
  };
};
