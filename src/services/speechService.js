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
  en: { code: 'en-IN', name: 'English (India)', native: 'English' },
  hi: { code: 'hi-IN', name: 'Hindi', native: 'हिन्दी' },
  te: { code: 'te-IN', name: 'Telugu', native: 'తెలుగు' },
  ta: { code: 'ta-IN', name: 'Tamil', native: 'தமிழ்' },
  mr: { code: 'mr-IN', name: 'Marathi', native: 'मराठी' },
  bn: { code: 'bn-IN', name: 'Bengali', native: 'বাংলা' },
  gu: { code: 'gu-IN', name: 'Gujarati', native: 'ગુજરાતી' },
  kn: { code: 'kn-IN', name: 'Kannada', native: 'ಕನ್ನಡ' },
  ml: { code: 'ml-IN', name: 'Malayalam', native: 'മലയാളം' },
  pa: { code: 'pa-IN', name: 'Punjabi', native: 'ਪੰਜਾਬੀ' },
  ur: { code: 'ur-IN', name: 'Urdu', native: 'اردو' }
};

/**
 * Resolve BCP-47 locale from short language code
 */
export const getLocaleForLanguage = (langKey = 'en') => {
  return INDIAN_LANGUAGE_LOCALES[langKey]?.code || 'en-IN';
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
 * Text-to-Speech (TTS) voice guidance with Indian language support
 */
export const speakGuidanceText = (text, languageKey = 'en') => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const locale = getLocaleForLanguage(languageKey);
    utterance.lang = locale;
    utterance.rate = 0.92;
    utterance.pitch = 1.0;

    // Pick best matching voice if available
    const voices = window.speechSynthesis.getVoices();
    if (voices && voices.length > 0) {
      const matchedVoice = voices.find(v => v.lang === locale || v.lang.startsWith(languageKey));
      if (matchedVoice) {
        utterance.voice = matchedVoice;
      }
    }

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn('Speech synthesis notice:', err.message);
  }
};
