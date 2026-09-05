/**
 * MediMitra Multilingual Indian Speech Recognition (ASR) & Synthesis (TTS) Service
 * 
 * Strict Directives:
 * 1. 0% Fake/Mock speech recognition. If ASR is unavailable or encounters error, gracefully notify the user and offer text/touch.
 * 2. Accurate BCP-47 locale tags for genuine Indian language speech models.
 * 3. Never interpret speech as autonomous medical advice or automated prescription.
 */

// Supported Indian Language BCP-47 Code Registry
export const INDIAN_LANGUAGE_LOCALES = {
  en: { code: 'en-IN', name: 'English', native: 'English', altCodes: ['en', 'en-GB', 'en-US', 'en-AU', 'en-CA'], flag: '🇬🇧' },
  hi: { code: 'hi-IN', name: 'Hindi', native: 'हिन्दी', altCodes: ['hi'], flag: '🇮🇳' },
  te: { code: 'te-IN', name: 'Telugu', native: 'తెలుగు', altCodes: ['te'], flag: '🇮🇳' },
  ta: { code: 'ta-IN', name: 'Tamil', native: 'தமிழ்', altCodes: ['ta', 'ta-LK', 'ta-SG', 'ta-MY'], flag: '🇮🇳' },
  mr: { code: 'mr-IN', name: 'Marathi', native: 'मराठी', altCodes: ['mr'], flag: '🇮🇳' },
  bn: { code: 'bn-IN', name: 'Bengali', native: 'বাংলা', altCodes: ['bn', 'bn-BD'], flag: '🇮🇳' },
  gu: { code: 'gu-IN', name: 'Gujarati', native: 'ગુજરાતી', altCodes: ['gu'], flag: '🇮🇳' },
  kn: { code: 'kn-IN', name: 'Kannada', native: 'ಕನ್ನಡ', altCodes: ['kn'], flag: '🇮🇳' },
  ml: { code: 'ml-IN', name: 'Malayalam', native: 'മലയാളം', altCodes: ['ml'], flag: '🇮🇳' },
  pa: { code: 'pa-IN', name: 'Punjabi', native: 'ਪੰਜਾਬੀ', altCodes: ['pa', 'pa-PK'], flag: '🇮🇳' },
  ur: { code: 'ur-IN', name: 'Urdu', native: 'اردو', altCodes: ['ur', 'ur-PK'], flag: '🇮🇳' }
};

/**
 * Normalizes any language key or locale (e.g. 'te-IN', 'TE', 'en-US') to its canonical short key (e.g. 'te', 'en')
 */
export const normalizeLangKey = (langKey = 'en') => {
  if (!langKey || typeof langKey !== 'string') return 'en';
  const clean = langKey.trim().toLowerCase().replace(/_/g, '-');
  if (INDIAN_LANGUAGE_LOCALES[clean]) return clean;

  const base = clean.split('-')[0];
  if (INDIAN_LANGUAGE_LOCALES[base]) return base;

  for (const [key, val] of Object.entries(INDIAN_LANGUAGE_LOCALES)) {
    if (val.code.toLowerCase() === clean) return key;
    if (val.altCodes && val.altCodes.some(ac => ac.toLowerCase() === clean)) return key;
  }
  return 'en';
};

/**
 * Resolve metadata for a language (code, name, native, altCodes)
 */
export const getLanguageMeta = (langKey = 'en') => {
  const norm = normalizeLangKey(langKey);
  return INDIAN_LANGUAGE_LOCALES[norm] || INDIAN_LANGUAGE_LOCALES.en;
};

/**
 * Resolve BCP-47 locale from short language code or locale string
 */
export const getLocaleForLanguage = (langKey = 'en') => {
  return getLanguageMeta(langKey).code;
};

/**
 * Check if browser supports Web Speech API
 */
export const isSpeechRecognitionSupported = () => {
  if (typeof window === 'undefined') return false;
  return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
};

/**
 * Parse speech recognition errors into patient-friendly explanations
 */
export const parseSpeechError = (errorEvent) => {
  const errorType = errorEvent?.error || errorEvent?.message || 'unknown';

  switch (errorType) {
    case 'not-allowed':
    case 'permission-denied':
      return {
        code: 'PERMISSION_DENIED',
        title: 'Microphone Permission Needed',
        message: 'Microphone access was blocked. Please tap "Allow" in your browser, or continue using touch/keyboard below.',
        canRetry: false,
        fallbackToTouch: true
      };
    case 'no-speech':
      return {
        code: 'NO_SPEECH',
        title: 'No Voice Detected',
        message: 'We could not hear your voice. Please speak closer to the microphone and try again.',
        canRetry: true,
        fallbackToTouch: true
      };
    case 'audio-capture':
      return {
        code: 'NO_HARDWARE',
        title: 'No Microphone Detected',
        message: 'No microphone was found on this device. Please use the on-screen touch and keyboard options.',
        canRetry: false,
        fallbackToTouch: true
      };
    case 'network':
      return {
        code: 'NETWORK_ERROR',
        title: 'Speech Network Service Busy',
        message: 'Network speech service is temporarily slow. You can retry or use the touch buttons below.',
        canRetry: true,
        fallbackToTouch: true
      };
    case 'language-not-supported':
      return {
        code: 'LANG_UNSUPPORTED',
        title: 'Language Model Not Available',
        message: 'Speech recognition for this dialect is not supported on this browser. Please use text or select standard options.',
        canRetry: false,
        fallbackToTouch: true
      };
    case 'aborted':
      return {
        code: 'ABORTED',
        title: 'Recording Stopped',
        message: 'Voice recording was stopped.',
        canRetry: true,
        fallbackToTouch: true
      };
    default:
      return {
        code: 'GENERIC_ERROR',
        title: 'Voice Input Notice',
        message: 'Speech recognition encountered a temporary issue. Please retry or tap your answer below.',
        canRetry: true,
        fallbackToTouch: true
      };
  }
};

/**
 * Initialize and start a genuine Web Speech Recognition session
 */
export const startSpeechSession = ({
  languageKey = 'en',
  onInterim = () => {},
  onFinal = () => {},
  onError = () => {},
  onEnd = () => {}
}) => {
  if (!isSpeechRecognitionSupported()) {
    onError({
      code: 'UNSUPPORTED',
      title: 'Speech Recognition Unavailable',
      message: 'This web browser does not support speech recognition. Please use keyboard or on-screen touch options.',
      canRetry: false,
      fallbackToTouch: true
    });
    return null;
  }

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();

  const locale = getLocaleForLanguage(languageKey);
  recognition.lang = locale;
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;

  let finalTranscript = '';

  recognition.onresult = (event) => {
    let interim = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        finalTranscript += transcript;
      } else {
        interim += transcript;
      }
    }

    if (interim) {
      onInterim(interim);
    }
    if (finalTranscript) {
      onFinal(finalTranscript.trim());
    }
  };

  recognition.onerror = (event) => {
    const parsed = parseSpeechError(event);
    onError(parsed);
  };

  recognition.onend = () => {
    onEnd(finalTranscript.trim());
  };

  try {
    recognition.start();
    return recognition;
  } catch (startErr) {
    const parsed = parseSpeechError({ error: startErr.message });
    onError(parsed);
    return null;
  }
};

/**
 * Matches natural spoken text against predefined clinical options (English, Hindi, Telugu)
 */
export const matchSpokenTextToOptions = (spokenText, optionsList = [], activeLang = 'en') => {
  if (!spokenText || !optionsList || optionsList.length === 0) {
    return {
      matchedOption: null,
      matchedIndex: -1,
      isExactMatch: false,
      rawSpoken: spokenText
    };
  }

  const sLower = spokenText.toLowerCase().trim();

  // 1. Direct text match against active language or English
  for (let i = 0; i < optionsList.length; i++) {
    const opt = optionsList[i];
    const textInLang = (opt[activeLang] || opt.en || '').toLowerCase().trim();
    const textInEn = (opt.en || '').toLowerCase().trim();

    if (sLower.includes(textInLang) || textInLang.includes(sLower) || sLower.includes(textInEn) || textInEn.includes(sLower)) {
      return {
        matchedOption: opt,
        matchedIndex: i,
        isExactMatch: true,
        rawSpoken: spokenText
      };
    }
  }

  // 2. Token overlap matching across words
  const spokenTokens = sLower.split(/[\s,\.\(\)\-]+/).filter(t => t.length >= 2);
  let bestTokenMatch = null;
  let maxMatchedTokens = 0;

  for (let i = 0; i < optionsList.length; i++) {
    const opt = optionsList[i];
    const targetText = `${opt[activeLang] || ''} ${opt.en || ''}`.toLowerCase();
    const optTokens = targetText.split(/[\s,\.\(\)\-]+/).filter(t => t.length >= 2);

    let matchCount = 0;
    for (const token of spokenTokens) {
      if (optTokens.some(ot => ot.includes(token) || token.includes(ot))) {
        matchCount++;
      }
    }

    if (matchCount >= 2 && matchCount > maxMatchedTokens) {
      maxMatchedTokens = matchCount;
      bestTokenMatch = {
        matchedOption: opt,
        matchedIndex: i,
        isExactMatch: false,
        rawSpoken: spokenText
      };
    }
  }

  if (bestTokenMatch) {
    return bestTokenMatch;
  }

  // 3. Keyword-based intent matching for clinical terms
  const keywordMappings = [
    { keywords: ['yes', 'yeah', 'haan', 'ha', 'avunu', 'undhi', 'హ అవును', 'हाँ', 'అవును'], matchTag: 'yes' },
    { keywords: ['no', 'nah', 'nahi', 'ledu', 'కాదు', 'नहीं', 'లేదు'], matchTag: 'no' },
    { keywords: ['severe', 'heavy', 'bahut jyada', 'ekkuva', 'తీవ్రమైన', 'बहुत ज्यादा', 'తీవ్రంగా'], matchTag: 'severe' },
    { keywords: ['mild', 'light', 'thoda', 'konchem', 'కొద్దిగా', 'हल्का', 'స్వల్పంగా'], matchTag: 'mild' },
    { keywords: ['today', 'aaj', 'ee roju', 'ఈ రోజు', 'ఈ రోజే', 'आज', 'hours ago'], matchTag: 'today' },
    { keywords: ['yesterday', 'kal', 'ninna', 'నిన్న', 'कल', 'days ago'], matchTag: 'yesterday' }
  ];

  for (const km of keywordMappings) {
    if (km.keywords.some(kw => sLower.includes(kw))) {
      // Find option matching this tag
      for (let i = 0; i < optionsList.length; i++) {
        const optText = (optionsList[i].en || '').toLowerCase();
        if (optText.includes(km.matchTag) || km.keywords.some(kw => optText.includes(kw))) {
          return {
            matchedOption: optionsList[i],
            matchedIndex: i,
            isExactMatch: false,
            rawSpoken: spokenText
          };
        }
      }
    }
  }

  return {
    matchedOption: null,
    matchedIndex: -1,
    isExactMatch: false,
    rawSpoken: spokenText
  };
};

/**
 * Asynchronously load speech synthesis voices, waiting for voiceschanged if necessary
 */
export const getVoicesAsync = (timeoutMs = 500) => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return Promise.resolve([]);
  }
  const immediate = window.speechSynthesis.getVoices();
  if (immediate && immediate.length > 0) {
    return Promise.resolve(immediate);
  }
  return new Promise((resolve) => {
    let resolved = false;
    const cleanup = () => {
      if (resolved) return;
      resolved = true;
      try {
        window.speechSynthesis.removeEventListener('voiceschanged', onVoices);
      } catch (e) {}
      resolve(window.speechSynthesis.getVoices() || []);
    };
    const onVoices = () => cleanup();
    try {
      window.speechSynthesis.addEventListener('voiceschanged', onVoices);
    } catch (e) {}
    setTimeout(cleanup, timeoutMs);
  });
};

/**
 * Genuine BCP-47 matching for Indian Language Speech Synthesis.
 * Matches regional dialects (e.g. te-IN matches te, te-*, or voice named Telugu).
 * Never erroneously falls back to an unrelated language like English or Hindi for regional tongues.
 */
export const findCompatibleVoice = (langKey = 'en', voices = null) => {
  const voiceList = voices || (typeof window !== 'undefined' && window.speechSynthesis ? window.speechSynthesis.getVoices() : []);
  if (!voiceList || voiceList.length === 0) {
    return null;
  }

  const meta = getLanguageMeta(langKey);
  const targetLocale = meta.code.toLowerCase(); // e.g. 'te-in'
  const baseCode = normalizeLangKey(langKey).toLowerCase(); // e.g. 'te'
  const altCodes = (meta.altCodes || []).map(c => c.toLowerCase());
  const langNameLower = meta.name.toLowerCase(); // e.g. 'telugu'
  const nativeName = meta.native; // e.g. 'తెలుగు'

  const normVoiceLang = (v) => (v.lang || '').toLowerCase().replace(/_/g, '-').trim();

  // Pass 1: Exact BCP-47 match (e.g. voice.lang is 'te-in' for target 'te-in')
  let match = voiceList.find(v => normVoiceLang(v) === targetLocale);
  if (match) return match;

  // Pass 2: Dialect / Regional variant match (e.g. voice.lang starts with 'te-')
  match = voiceList.find(v => normVoiceLang(v).startsWith(`${baseCode}-`));
  if (match) return match;

  // Pass 3: Exact base language match (e.g. voice.lang is 'te')
  match = voiceList.find(v => normVoiceLang(v) === baseCode);
  if (match) return match;

  // Pass 4: Reverse dialect match (e.g. targetLocale is 'te-in' and voice.lang is 'te')
  match = voiceList.find(v => {
    const vl = normVoiceLang(v);
    return vl && targetLocale.startsWith(`${vl}-`);
  });
  if (match) return match;

  // Pass 5: Known alternative codes for this language (e.g. 'bn-bd' for Bengali, 'en-us' for English)
  if (altCodes.length > 0) {
    match = voiceList.find(v => {
      const vl = normVoiceLang(v);
      return altCodes.some(ac => vl === ac || vl.startsWith(`${ac}-`) || ac.startsWith(`${vl}-`));
    });
    if (match) return match;
  }

  // Pass 6: Check voice name for language name if tags are non-standard
  match = voiceList.find(v => {
    const vName = (v.name || '').toLowerCase();
    const matchesName = vName.includes(langNameLower) || (nativeName && v.name.includes(nativeName));
    if (!matchesName) return false;
    // Guard: Ensure voice doesn't belong to another known language
    for (const otherKey of Object.keys(INDIAN_LANGUAGE_LOCALES)) {
      if (otherKey !== baseCode) {
        if (normVoiceLang(v).startsWith(`${otherKey}-`) || normVoiceLang(v) === otherKey) {
          return false;
        }
      }
    }
    return true;
  });
  if (match) return match;

  return null;
};

/**
 * Text-to-Speech (TTS) voice guidance with truthful Indian language voice verification.
 * 
 * Strict Directives:
 * 1. Only speaks when explicitly called (e.g. from Audio Assist).
 * 2. Verifies compatible voice in browser getVoices() list.
 * 3. Never silently speaks in English or Hindi when a regional language lacks voice support.
 * 4. Shows clear notice if voice pack is not installed on device/browser.
 * 5. Emits comprehensive debug logs with selected language, requested BCP-47 locale, and matched voice.
 */
export const speakGuidanceText = (text, languageKey = 'en', options = {}) => {
  const meta = getLanguageMeta(languageKey);
  const targetLocale = meta.code;
  const langName = meta.name;

  console.log('[MediMitra TTS] Audio Assist request initiated:', {
    requestedLanguage: languageKey,
    resolvedLocale: targetLocale,
    languageName: langName,
    textLength: (text || '').length
  });

  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    console.warn('[MediMitra TTS] speechSynthesis API unavailable');
    const status = {
      supported: false,
      code: 'UNSUPPORTED',
      message: 'Speech synthesis is not supported on this browser or device.'
    };
    if (options.onStatus) options.onStatus(status);
    return status;
  }

  try {
    window.speechSynthesis.cancel();

    const voices = window.speechSynthesis.getVoices() || [];
    const matchedVoice = findCompatibleVoice(languageKey, voices);

    if (!matchedVoice) {
      console.warn('[MediMitra TTS] No compatible voice found for requested language:', {
        requestedLanguage: languageKey,
        resolvedLocale: targetLocale,
        languageName: langName,
        installedVoicesCount: voices.length,
        installedVoicesList: voices.map(v => `${v.name} (${v.lang})`)
      });

      const message = `Audio is not available for ${langName} on this device/browser. Please use text or install a ${langName} voice/language pack.`;
      const status = {
        supported: false,
        code: 'NO_VOICE_FOR_LANGUAGE',
        message,
        locale: targetLocale,
        languageName: langName
      };

      if (options.onStatus) options.onStatus(status);
      return status;
    }

    console.log('[MediMitra TTS] Matched voice successfully:', {
      requestedLanguage: languageKey,
      matchedVoiceName: matchedVoice.name,
      matchedVoiceLang: matchedVoice.lang,
      isDefault: matchedVoice.default
    });

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = matchedVoice;
    utterance.lang = matchedVoice.lang || targetLocale;
    utterance.rate = 0.92;
    utterance.pitch = 1.0;

    if (options.onStart) utterance.onstart = options.onStart;
    if (options.onEnd) utterance.onend = options.onEnd;

    utterance.onerror = (e) => {
      console.error('[MediMitra TTS] Speech synthesis utterance error:', {
        error: e.error,
        language: languageKey,
        targetLocale,
        matchedVoice: matchedVoice.name
      });
      if (options.onError) options.onError(e);
      if (options.onStatus) {
        options.onStatus({
          supported: false,
          code: 'PLAYBACK_ERROR',
          message: `Audio playback encountered an issue for ${langName}. Please refer to on-screen text.`,
          error: e.error,
          locale: targetLocale
        });
      }
    };

    window.speechSynthesis.speak(utterance);

    const status = {
      supported: true,
      code: 'PLAYING',
      locale: targetLocale,
      voiceName: matchedVoice.name,
      languageName: langName
    };
    if (options.onStatus) options.onStatus(status);
    return status;
  } catch (err) {
    console.error('[MediMitra TTS] Unexpected error in speakGuidanceText:', err);
    const status = {
      supported: false,
      code: 'ERROR',
      message: 'Speech synthesis encountered an error.',
      error: err.message
    };
    if (options.onStatus) options.onStatus(status);
    return status;
  }
};
