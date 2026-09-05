/**
 * MediMitra National Language Translation Mission (Bhashini) / AI4Bharat Backend Proxy
 * 
 * Secure Service Abstraction:
 * - Keeps all Bhashini credentials safely on the backend.
 * - 0% API key exposure to frontend clients.
 * - Supports genuine Indian language ASR (Speech-to-Text) and TTS (Text-to-Speech) pipelines.
 * - When credentials are not configured, transparently reports status.
 */

// Supported 11 Indian Languages in Bhashini / AI4Bharat ULCA Registry
export const BHASHINI_SUPPORTED_LANGUAGES = {
  en: { bhashiniCode: 'en', locale: 'en-IN', name: 'English', native: 'English' },
  hi: { bhashiniCode: 'hi', locale: 'hi-IN', name: 'Hindi', native: 'हिन्दी' },
  te: { bhashiniCode: 'te', locale: 'te-IN', name: 'Telugu', native: 'తెలుగు' },
  ta: { bhashiniCode: 'ta', locale: 'ta-IN', name: 'Tamil', native: 'தமிழ்' },
  mr: { bhashiniCode: 'mr', locale: 'mr-IN', name: 'Marathi', native: 'मराठी' },
  bn: { bhashiniCode: 'bn', locale: 'bn-IN', name: 'Bengali', native: 'বাংলা' },
  gu: { bhashiniCode: 'gu', locale: 'gu-IN', name: 'Gujarati', native: 'ગુજરાતી' },
  kn: { bhashiniCode: 'kn', locale: 'kn-IN', name: 'Kannada', native: 'ಕನ್ನಡ' },
  ml: { bhashiniCode: 'ml', locale: 'ml-IN', name: 'Malayalam', native: 'മലയാളം' },
  pa: { bhashiniCode: 'pa', locale: 'pa-IN', name: 'Punjabi', native: 'ਪੰਜਾਬੀ' },
  ur: { bhashiniCode: 'ur', locale: 'ur-IN', name: 'Urdu', native: 'اردو' }
};

/**
 * Normalizes any locale tag or language key (e.g. 'te-IN', 'TE', 'telugu') to standard 2-letter Bhashini code
 */
export const normalizeBhashiniLang = (lang = 'en') => {
  if (!lang || typeof lang !== 'string') return 'en';
  const clean = lang.trim().toLowerCase().replace(/_/g, '-');
  if (BHASHINI_SUPPORTED_LANGUAGES[clean]) return BHASHINI_SUPPORTED_LANGUAGES[clean].bhashiniCode;

  const base = clean.split('-')[0];
  if (BHASHINI_SUPPORTED_LANGUAGES[base]) return BHASHINI_SUPPORTED_LANGUAGES[base].bhashiniCode;

  for (const [k, v] of Object.entries(BHASHINI_SUPPORTED_LANGUAGES)) {
    if (v.locale.toLowerCase() === clean || v.name.toLowerCase() === clean) {
      return v.bhashiniCode;
    }
  }
  return null;
};

class BhashiniVoiceService {
  constructor() {
    this.apiKey = process.env.BHASHINI_API_KEY || null;
    this.userId = process.env.BHASHINI_USER_ID || null;
    this.pipelineUrl = process.env.BHASHINI_PIPELINE_URL || 'https://dhruva-api.bhashini.gov.in/services/inference/pipeline';
  }

  isConfigured() {
    return Boolean(this.apiKey && this.userId);
  }

  isTtsConfigured() {
    return this.isConfigured();
  }

  getStatus() {
    return {
      activeProvider: this.isConfigured() ? 'BHASHINI_ULCA' : 'BROWSER_WEB_SPEECH_API',
      bhashiniConfigured: this.isConfigured(),
      asrConfigured: this.isConfigured(),
      ttsConfigured: this.isConfigured(),
      credentialsRequired: this.isConfigured() ? [] : ['BHASHINI_API_KEY', 'BHASHINI_USER_ID'],
      supportedLocales: Object.values(BHASHINI_SUPPORTED_LANGUAGES).map(l => ({
        code: l.locale,
        bhashiniCode: l.bhashiniCode,
        name: `${l.name} (${l.native})`
      }))
    };
  }

  /**
   * Synthesize Indian language text into genuine speech audio via Bhashini ULCA TTS pipeline
   */
  async synthesizeSpeech(text, language = 'te', gender = 'female') {
    if (!text || typeof text !== 'string' || !text.trim()) {
      const err = new Error('Text to synthesize is required.');
      err.status = 400;
      throw err;
    }

    const bhashiniLang = normalizeBhashiniLang(language);
    if (!bhashiniLang) {
      const err = new Error(`Unsupported Bhashini language: ${language}. Supported languages are en, hi, te, ta, mr, bn, gu, kn, ml, pa, ur.`);
      err.status = 400;
      throw err;
    }

    if (!this.isConfigured()) {
      const err = new Error('Bhashini credentials (BHASHINI_API_KEY, BHASHINI_USER_ID) are not configured on server.');
      err.code = 'BHASHINI_NOT_CONFIGURED';
      err.status = 503;
      throw err;
    }

    const payload = {
      pipelineTasks: [
        {
          taskType: 'tts',
          config: {
            language: { sourceLanguage: bhashiniLang },
            gender: gender || 'female',
            samplingRate: 22050
          }
        }
      ],
      inputData: {
        input: [
          { source: text.trim() }
        ]
      }
    };

    const response = await fetch(this.pipelineUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': this.apiKey,
        'userID': this.userId
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errText = await response.text();
      const err = new Error(`Bhashini TTS API returned HTTP ${response.status}: ${errText}`);
      err.status = response.status >= 500 ? 502 : response.status;
      throw err;
    }

    const data = await response.json();
    const ttsTaskOutput = data?.pipelineResponse?.find(t => t.taskType === 'tts') || data?.pipelineResponse?.[0];
    const audioObj = ttsTaskOutput?.output?.[0]?.audio?.[0] || ttsTaskOutput?.audio?.[0];
    const audioContent = audioObj?.audioContent || '';
    const audioUri = audioObj?.audioUri || null;
    const audioFormat = ttsTaskOutput?.config?.audioFormat || 'wav';

    if (!audioContent && !audioUri) {
      throw new Error('Bhashini TTS did not return audioContent in response payload.');
    }

    return {
      success: true,
      provider: 'BHASHINI_ULCA',
      language: bhashiniLang,
      audioContent,
      audioUri,
      audioFormat
    };
  }

  /**
   * Transcribe spoken audio via Bhashini ULCA ASR pipeline
   */
  async transcribeAudio(audioBase64, sourceLanguage = 'hi') {
    if (!this.isConfigured()) {
      const err = new Error('BHASHINI_API_KEY and BHASHINI_USER_ID are not configured in server environment.');
      err.status = 503;
      throw err;
    }

    const bhashiniLang = normalizeBhashiniLang(sourceLanguage) || 'hi';

    const payload = {
      pipelineTasks: [
        {
          taskType: 'asr',
          config: {
            language: { sourceLanguage: bhashiniLang }
          }
        }
      ],
      inputData: {
        audio: [{ audioContent: audioBase64 }]
      }
    };

    const response = await fetch(this.pipelineUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': this.apiKey,
        'userID': this.userId
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errText = await response.text();
      const err = new Error(`Bhashini ASR API returned HTTP ${response.status}: ${errText}`);
      err.status = response.status >= 500 ? 502 : response.status;
      throw err;
    }

    const data = await response.json();
    const asrOutput = data?.pipelineResponse?.[0]?.output?.[0]?.source;

    return {
      success: true,
      provider: 'BHASHINI_ULCA',
      transcript: asrOutput || '',
      sourceLanguage: bhashiniLang
    };
  }
}

export const bhashiniService = new BhashiniVoiceService();
