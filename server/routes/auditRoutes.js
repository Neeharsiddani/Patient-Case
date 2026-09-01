import express from 'express';
import { query } from '../db/database.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/audit-logs
 * Hospital administrators & authorized admins view immutable audit trails
 */
router.get('/', requireAuth, requireRole('HOSPITAL_ADMIN', 'ADMIN'), async (req, res, next) => {
  try {
    const { limit = 50, offset = 0, action, resourceType } = req.query;

    let sql = 'SELECT * FROM audit_logs WHERE 1=1';
    const params = [];

    if (req.user.role === 'HOSPITAL_ADMIN' && req.user.hospital_id) {
      sql += ' AND hospital_id = ?';
      params.push(req.user.hospital_id);
    }

    if (action) {
      sql += ' AND action = ?';
      params.push(action);
    }

    if (resourceType) {
      sql += ' AND resource_type = ?';
      params.push(resourceType);
    }

    sql += ' ORDER BY timestamp DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit, 10), parseInt(offset, 10));

    const logs = await query(sql, params);

    res.json({
      success: true,
      count: logs.length,
      logs: logs.map(l => ({
        id: l.id,
        timestamp: l.timestamp,
        userId: l.user_id,
        userRole: l.user_role,
        action: l.action,
        resourceType: l.resource_type,
        resourceId: l.resource_id,
        details: l.details ? JSON.parse(l.details) : {},
        ipAddress: l.ip_address
      }))
    });
  } catch (err) {
    next(err);
  }
});

export default router;
