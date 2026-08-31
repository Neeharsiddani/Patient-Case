/**
 * MediMitra National Language Translation Mission (Bhashini) / AI4Bharat Backend Proxy
 * 
 * Secure Service Abstraction:
 * - Keeps all Bhashini credentials safely on the backend.
 * - 0% API key exposure to frontend clients.
 * - When credentials are not configured, transparently reports status so the browser Web Speech API is used.
 */

class BhashiniVoiceService {
  constructor() {
    this.apiKey = process.env.BHASHINI_API_KEY || null;
    this.userId = process.env.BHASHINI_USER_ID || null;
    this.pipelineUrl = process.env.BHASHINI_PIPELINE_URL || 'https://dhruva-api.bhashini.gov.in/services/inference/pipeline';
  }

  isConfigured() {
    return Boolean(this.apiKey && this.userId);
  }

  getStatus() {
    return {
      activeProvider: this.isConfigured() ? 'BHASHINI_AI4BHARAT_ASR' : 'BROWSER_WEB_SPEECH_API',
      bhashiniConfigured: this.isConfigured(),
      credentialsRequired: this.isConfigured() ? [] : ['BHASHINI_API_KEY', 'BHASHINI_USER_ID'],
      supportedLocales: [
        { code: 'en-IN', name: 'English (India)' },
        { code: 'hi-IN', name: 'Hindi (हिन्दी)' },
        { code: 'te-IN', name: 'Telugu (తెలుగు)' },
        { code: 'ta-IN', name: 'Tamil (தமிழ்)' },
        { code: 'mr-IN', name: 'Marathi (मराठी)' },
        { code: 'bn-IN', name: 'Bengali (বাংলা)' },
        { code: 'gu-IN', name: 'Gujarati (ગુજરાતી)' },
        { code: 'kn-IN', name: 'Kannada (ಕನ್ನಡ)' },
        { code: 'ml-IN', name: 'Malayalam (മലയാളം)' },
        { code: 'pa-IN', name: 'Punjabi (ਪੰਜਾਬੀ)' },
        { code: 'ur-IN', name: 'Urdu (اردو)' }
      ]
    };
  }

  async transcribeAudio(audioBase64, sourceLanguage = 'hi') {
    if (!this.isConfigured()) {
      throw new Error('BHASHINI_API_KEY and BHASHINI_USER_ID are not configured in server environment.');
    }

    const payload = {
      pipelineTasks: [
        {
          taskType: 'asr',
          config: {
            language: { sourceLanguage }
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

    const data = await response.json();
    const asrOutput = data?.pipelineResponse?.[0]?.output?.[0]?.source;

    return {
      success: true,
      provider: 'BHASHINI_ULCA',
      transcript: asrOutput || '',
      sourceLanguage
    };
  }
}

export const bhashiniService = new BhashiniVoiceService();
