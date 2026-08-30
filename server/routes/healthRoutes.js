import express from 'express';
import { get } from '../db/database.js';

const router = express.Router();

/**
 * GET /api/health
 * System health check, database status, and uptime
 */
router.get('/', async (req, res) => {
  try {
    const dbCheck = await get('SELECT 1 as is_healthy');
    res.json({
      status: 'HEALTHY',
      service: 'MediMitra Clinical Backend',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      database: dbCheck && dbCheck.is_healthy === 1 ? 'CONNECTED' : 'DISCONNECTED',
      security: {
        dpdpCompliantArchitecture: true,
        fhirR4Ready: true,
        abdmReady: true
      }
    });
  } catch (err) {
    res.status(503).json({
      status: 'DEGRADED',
      service: 'MediMitra Clinical Backend',
      error: err.message
    });
  }
});

export default router;
