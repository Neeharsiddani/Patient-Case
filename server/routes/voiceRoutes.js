import express from 'express';
import { bhashiniService } from '../services/bhashiniService.js';

const router = express.Router();

/**
 * GET /api/voice/status
 * Returns current voice provider configuration & genuine language support
 */
router.get('/status', (req, res) => {
  const status = bhashiniService.getStatus();
  res.json({
    success: true,
    ...status
  });
});

/**
 * POST /api/voice/asr
 * Backend proxy for Bhashini ASR inference
 */
router.post('/asr', async (req, res, next) => {
  try {
    const { audioBase64, language = 'hi' } = req.body;

    if (!audioBase64) {
      return res.status(400).json({
        success: false,
        error: 'Missing Audio',
        message: 'Base64 audio payload is required.'
      });
    }

    if (!bhashiniService.isConfigured()) {
      return res.status(503).json({
        success: false,
        error: 'Bhashini Not Configured',
        message: 'Bhashini API credentials (BHASHINI_API_KEY, BHASHINI_USER_ID) are not configured. The client will use Browser Web Speech ASR natively.',
        fallbackProvider: 'BROWSER_WEB_SPEECH_API'
      });
    }

    const result = await bhashiniService.transcribeAudio(audioBase64, language);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
