import express from 'express';
import { abdmService } from '../services/abdmService.js';
import { recordAuditLog } from '../middleware/audit.js';

const router = express.Router();

/**
 * GET /api/abdm/status
 * Returns current ABDM Gateway configuration status
 */
router.get('/status', (req, res) => {
  const status = abdmService.getStatus();
  res.json({
    success: true,
    ...status
  });
});

/**
 * POST /api/abdm/verify-abha
 * Official ABDM ABHA verification endpoint
 */
router.post('/verify-abha', async (req, res, next) => {
  try {
    const { abhaId, authMode = 'MOBILE_OTP' } = req.body;

    if (!abhaId) {
      return res.status(400).json({
        success: false,
        error: 'Missing ABHA ID',
        message: 'ABHA Number or ABHA Address is required.'
      });
    }

    if (!abdmService.isConfigured()) {
      return res.status(503).json({
        success: false,
        status: 'CONFIGURATION_REQUIRED',
        error: 'ABDM Gateway Not Configured',
        message: 'Official NHA ABDM Gateway credentials (ABDM_CLIENT_ID, ABDM_CLIENT_SECRET) are not configured in the server environment. The patient may continue with unverified ABHA identification.',
        unverifiedEntryPermitted: true
      });
    }

    const result = await abdmService.initAbhaAuth(abhaId, authMode);
    
    await recordAuditLog({
      userId: req.user?.id || 'PATIENT_KIOSK',
      userRole: 'PATIENT',
      action: 'ABDM_AUTH_INITIATED',
      resourceType: 'ABHA_AUTH',
      resourceId: abhaId,
      details: { abhaId, authMode, status: result.status },
      ipAddress: req.ip || '127.0.0.1'
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
