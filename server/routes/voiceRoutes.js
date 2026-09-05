import express from 'express';
import { bhashiniService, normalizeBhashiniLang } from '../services/bhashiniService.js';

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
    if (err.status) {
      return res.status(err.status).json({
        success: false,
        error: err.code || 'Bhashini Error',
        message: err.message
      });
    }
    next(err);
  }
});

/**
 * POST /api/voice/tts
 * Backend proxy for Bhashini Text-to-Speech (TTS) synthesis
 */
router.post('/tts', async (req, res, next) => {
  try {
    const { text, language = 'en', gender = 'female' } = req.body;

    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Missing Text',
        message: 'Text to synthesize is required.'
      });
    }

    const normalizedLang = normalizeBhashiniLang(language);
    if (!normalizedLang) {
      return res.status(400).json({
        success: false,
        error: 'Unsupported Language',
        message: `Language '${language}' is not supported for Bhashini Text-to-Speech.`
      });
    }

    if (!bhashiniService.isTtsConfigured()) {
      return res.status(503).json({
        success: false,
        error: 'Bhashini TTS Not Configured',
        message: 'Bhashini TTS API credentials (BHASHINI_API_KEY, BHASHINI_USER_ID) are not configured on the server. The client should use local speech synthesis fallback if available.',
        fallbackProvider: 'BROWSER_WEB_SPEECH_API'
      });
    }

    const result = await bhashiniService.synthesizeSpeech(text, normalizedLang, gender);
    res.json(result);
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({
        success: false,
        error: err.code || 'Bhashini TTS Error',
        message: err.message
      });
    }
    next(err);
  }
});

export default router;
