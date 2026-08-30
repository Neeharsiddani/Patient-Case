import React, { useState, useEffect, useRef } from 'react';
import { 
  Heart, 
  Thermometer, 
  Brain, 
  Activity, 
  Wind, 
  HelpCircle, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Check, 
  ChevronRight, 
  ArrowLeft, 
  RotateCcw, 
  AlertTriangle, 
  ShieldAlert, 
  Sparkles, 
  Edit3, 
  CheckCircle2, 
  Send, 
  MessageSquare, 
  Sliders, 
  Globe, 
  Radio
} from 'lucide-react';
import { usePatient } from '../../context/PatientContext';
import { 
  primaryComplaints, 
  clinicalQuestionsData, 
  evaluateClinicalRedFlags,
  supportedHistoryLanguages 
} from '../../data/clinicalFlows';

export const Step4_ClinicalHistory = () => {
  const { 
    kioskForm, 
    setKioskForm, 
    language, 
    setLanguage, 
    speakText,
    t
  } = usePatient();

  // Active sub-language for history taking (defaults to patient's chosen lang if in en/hi/te, else 'en')
  const [historyLang, setHistoryLang] = useState(() => {
    return ['en', 'hi', 'te'].includes(language) ? language : 'en';
  });

  // Input method mode: 'touch' | 'voice'
  const [inputMode, setInputMode] = useState('touch'); // 'touch' | 'voice'
  const [isListening, setIsListening] = useState(false);
  const [voiceWaveform, setVoiceWaveform] = useState(false);

  // Conversation stage:
  // 'select_complaint' -> 'answering_questions' -> 'review_summary'
  const [stage, setStage] = useState(() => {
    return kioskForm.structuredHistory && kioskForm.structuredHistory.length > 0
      ? 'review_summary'
      : 'select_complaint';
  });

  const [selectedComplaintId, setSelectedComplaintId] = useState(kioskForm.selectedComplaintId || 'chest_pain');
  const [customComplaintText, setCustomComplaintText] = useState(kioskForm.customComplaint || '');
  const [currentQIndex, setCurrentQIndex] = useState(0);

  // Store patient's answers: { questionId: [selectedAnswersArray] }
  const [answers, setAnswers] = useState(() => {
    return kioskForm.historyAnswers || {};
  });

  // Free text input for custom answers / speech transcripts
  const [textAnswerInput, setTextAnswerInput] = useState('');
  
  // Real-time red flag alerts
  const [activeRedFlags, setActiveRedFlags] = useState([]);
  
  // Editing state when reviewing
  const [editingQuestionId, setEditingQuestionId] = useState(null);

  const chatEndRef = useRef(null);

  // Synchronize language if global language changes to en, hi, or te
  useEffect(() => {
    if (['en', 'hi', 'te'].includes(language)) {
      setHistoryLang(language);
    }
  }, [language]);

  const questionsList = clinicalQuestionsData[selectedComplaintId] || clinicalQuestionsData.chest_pain;
  const currentQuestion = questionsList[currentQIndex];

  // Auto-evaluate red flags whenever answers change
  useEffect(() => {
    const { redFlags } = evaluateClinicalRedFlags(selectedComplaintId, answers);
    setActiveRedFlags(redFlags);
  }, [answers, selectedComplaintId]);

  // Voice narration helper when a new question loads
  const speakCurrentQuestion = (qObj) => {
    if (!qObj) return;
    const prompt = qObj[historyLang] || qObj.en;
    speakText(prompt, historyLang === 'hi' ? 'hi-IN' : historyLang === 'te' ? 'te-IN' : 'en-IN');
  };

  // 1. Complaint selection
  const handleSelectPrimaryComplaint = (complaint) => {
    setSelectedComplaintId(complaint.id);
    const complaintName = complaint[historyLang] || complaint.en;
    
    // Initialize or reset answers for new flow
    setAnswers({});
    setCurrentQIndex(0);
    setStage('answering_questions');

    const nextQ = (clinicalQuestionsData[complaint.id] || clinicalQuestionsData.chest_pain)[0];
    setTimeout(() => {
      speakCurrentQuestion(nextQ);
    }, 400);
  };

  // 2. Select answer option for current question
  const handleSelectOption = (option) => {
    if (!currentQuestion) return;
    const optionText = option[historyLang] || option.en;

    setAnswers((prev) => {
      const currentList = prev[currentQuestion.id] || [];
      if (currentQuestion.type === 'multi') {
        const exists = currentList.includes(optionText);
        const updated = exists
          ? currentList.filter((item) => item !== optionText)
          : [...currentList, optionText];
        return { ...prev, [currentQuestion.id]: updated };
      } else {
        return { ...prev, [currentQuestion.id]: [optionText] };
      }
    });

    // If single choice, advance automatically after short delay
    if (currentQuestion.type !== 'multi') {
      setTimeout(() => {
        handleNextQuestion();
      }, 350);
    }
  };

  const handleAddCustomTextAnswer = () => {
    if (!textAnswerInput.trim() || !currentQuestion) return;
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: [textAnswerInput.trim()]
    }));
    setTextAnswerInput('');
    setTimeout(() => {
      handleNextQuestion();
    }, 300);
  };

  // Voice Input Simulation / Speech Recognition
  const handleToggleVoiceInput = () => {
    if (isListening) {
      setIsListening(false);
      setVoiceWaveform(false);
      return;
    }

    setIsListening(true);
    setVoiceWaveform(true);

    const voiceLangCode = historyLang === 'hi' ? 'hi-IN' : historyLang === 'te' ? 'te-IN' : 'en-IN';
    
    // Check if browser has SpeechRecognition API
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.lang = voiceLangCode;
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onresult = (event) => {
          const transcript = event.results[0][0].transcript;
          setTextAnswerInput(transcript);
          setIsListening(false);
          setVoiceWaveform(false);
        };

        recognition.onerror = () => {
          fallbackVoiceSimulation();
        };

        recognition.start();
        return;
      } catch (e) {
        fallbackVoiceSimulation();
      }
    } else {
      fallbackVoiceSimulation();
    }
  };

  const fallbackVoiceSimulation = () => {
    setTimeout(() => {
      setIsListening(false);
      setVoiceWaveform(false);
      if (currentQuestion && currentQuestion.options && currentQuestion.options.length > 0) {
        const firstOpt = currentQuestion.options[0];
        const spokenText = firstOpt[historyLang] || firstOpt.en;
        setTextAnswerInput(spokenText);
      }
    }, 2400);
  };

  const handleNextQuestion = () => {
    if (currentQIndex < questionsList.length - 1) {
      const nextIdx = currentQIndex + 1;
      setCurrentQIndex(nextIdx);
      const nextQ = questionsList[nextIdx];
      speakCurrentQuestion(nextQ);
    } else {
      // Reached end of questions -> Go to review screen
      saveAndCommitHistory();
      setStage('review_summary');
    }
  };

  const handlePrevQuestion = () => {
    if (currentQIndex > 0) {
      const prevIdx = currentQIndex - 1;
      setCurrentQIndex(prevIdx);
      const prevQ = questionsList[prevIdx];
      speakCurrentQuestion(prevQ);
    } else {
      setStage('select_complaint');
    }
  };

  // Convert answers to structured summary and commit to PatientContext
  const saveAndCommitHistory = () => {
    const selectedComp = primaryComplaints.find((c) => c.id === selectedComplaintId) || primaryComplaints[0];
    const compTitle = selectedComp[historyLang] || selectedComp.en;

    // Build structured question-answer pairs
    const structuredPairs = questionsList.map((q) => {
      const ansList = answers[q.id] || ['Not specified'];
      return {
        questionId: q.id,
        category: q.key,
        question: q[historyLang] || q.en,
        answers: ansList
      };
    });

    // Extract past history, duration, severity, allergies
    let extractedDuration = '2-3 Days';
    let extractedPainScore = 5;
    const extractedPastConds = [];
    const extractedAllergies = [];
    const extractedMeds = [];

    // Search answers for duration
    Object.keys(answers).forEach((k) => {
      const ansArr = answers[k] || [];
      const text = ansArr.join(' ');
      if (text.includes('1 hour') || text.includes('hours ago') || text.includes('Today')) {
        extractedDuration = 'Started Today (< 6 hours)';
      } else if (text.includes('2 to 3 days') || text.includes('1 to 2 days')) {
        extractedDuration = '2 to 3 Days';
      } else if (text.includes('week') || text.includes('weeks')) {
        extractedDuration = '> 1 Week';
      }

      if (text.includes('1-3')) extractedPainScore = 2;
      if (text.includes('4-6')) extractedPainScore = 5;
      if (text.includes('7-8')) extractedPainScore = 8;
      if (text.includes('9-10') || text.includes('Unbearable')) extractedPainScore = 9;

      if (text.includes('Diabetes') || text.includes('शुगर')) extractedPastConds.push('Type 2 Diabetes Mellitus');
      if (text.includes('Blood Pressure') || text.includes('बीपी')) extractedPastConds.push('Essential Hypertension');
      if (text.includes('Heart Attack') || text.includes('हार्ट अटैक')) extractedPastConds.push('Coronary Artery Disease (CAD)');

      if (text.includes('Penicillin') || text.includes('पेनिसिलिन')) extractedAllergies.push('Penicillin / Amoxicillin');
      if (text.includes('Painkillers') || text.includes('Diclofenac')) extractedAllergies.push('NSAIDs (Diclofenac / Ibuprofen)');
      if (text.includes('Sulfa') || text.includes('सल्फा')) extractedAllergies.push('Sulfa Drugs');

      if (text.includes('Blood Pressure tablets')) extractedMeds.push('Tab. Telmisartan 40mg (1-0-0)');
      if (text.includes('Diabetes medicines')) extractedMeds.push('Tab. Metformin 500mg (1-0-1)');
      if (text.includes('Blood thinners')) extractedMeds.push('Tab. Ecosprin 75mg (0-1-0)');
    });

    const complaintSummary = `${compTitle}${customComplaintText ? `: ${customComplaintText}` : ''}`;

    // Extract red flag titles
    const { redFlags } = evaluateClinicalRedFlags(selectedComplaintId, answers);
    const redFlagTitles = redFlags.map((rf) => rf[historyLang === 'hi' ? 'titleHi' : historyLang === 'te' ? 'titleTe' : 'titleEn'] || rf.titleEn);

    setKioskForm((prev) => ({
      ...prev,
      selectedComplaintId,
      customComplaint: customComplaintText,
      chiefComplaints: [complaintSummary],
      duration: extractedDuration,
      painScore: extractedPainScore,
      pastConditions: extractedPastConds.length > 0 ? extractedPastConds : prev.pastConditions,
      allergies: extractedAllergies.length > 0 ? extractedAllergies : (prev.allergies.length > 0 ? prev.allergies : ['No Known Drug Allergies (NKDA)']),
      currentMedications: extractedMeds.length > 0 ? extractedMeds : prev.currentMedications,
      historyAnswers: answers,
      structuredHistory: structuredPairs,
      redFlags: redFlagTitles.length > 0 ? redFlagTitles : prev.redFlags,
      triageLevel: redFlags.some(r => r.level === 'CRITICAL') ? 2 : (redFlags.length > 0 ? 3 : 4),
      triageCategory: redFlags.some(r => r.level === 'CRITICAL') ? 'Emergent (Red Flag)' : (redFlags.length > 0 ? 'Urgent (Yellow)' : 'Routine (Green)'),
      triageColor: redFlags.some(r => r.level === 'CRITICAL') ? 'red' : (redFlags.length > 0 ? 'yellow' : 'green')
    }));
  };

  const handleEditQuestion = (qIndex) => {
    setCurrentQIndex(qIndex);
    setStage('answering_questions');
    setEditingQuestionId(null);
  };

  const currentAnswerList = currentQuestion ? (answers[currentQuestion.id] || []) : [];

  return (
    <div className="space-y-6">
      {/* Top Header with Language Selector (EN, HI, TE) & Voice/Touch Switcher */}
      <div className="bg-slate-900 text-white p-4 sm:p-5 rounded-3xl shadow-md flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-cyan-600 rounded-2xl text-white shadow">
            <MessageSquare size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-bold font-heading text-white">
                {historyLang === 'hi' 
                  ? 'इंटरएक्टिव मरीज केस-टेकिंग' 
                  : historyLang === 'te' 
                  ? 'ఇంటరాక్టివ్ రోగి కేస్-టేకింగ్' 
                  : 'Interactive Clinical Case-Taking'}
              </h2>
              <span className="bg-cyan-900/80 text-cyan-300 border border-cyan-700 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full">
                AI Intake v2.5
              </span>
            </div>
            <p className="text-xs text-cyan-200 mt-0.5">
              {historyLang === 'hi'
                ? 'बोली या टच स्क्रीन द्वारा अपनी बीमारी का विवरण दें'
                : historyLang === 'te'
                ? 'వాయిస్ లేదా టచ్ ద్వారా మీ అనారోగ్య వివరాలను నమోదు చేయండి'
                : 'Adaptive clinical history taking via touch or voice conversation'}
            </p>
          </div>
        </div>

        {/* Controls: Language Buttons (EN / HI / TE) + Input Mode Toggle */}
        <div className="flex flex-wrap items-center gap-3">
          {/* 3 Supported Language Selector Chips */}
          <div className="flex items-center bg-slate-800 p-1 rounded-2xl border border-slate-700">
            {supportedHistoryLanguages.map((l) => (
              <button
                key={l.code}
                type="button"
                onClick={() => {
                  setHistoryLang(l.code);
                  setLanguage(l.code);
                }}
                style={{
                  backgroundColor: historyLang === l.code ? '#088395' : 'transparent',
                  color: historyLang === l.code ? '#ffffff' : '#cbd5e1'
                }}
                className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
              >
                <span>{l.native}</span>
              </button>
            ))}
          </div>

          {/* Touch / Voice Mode Toggle */}
          <div className="flex items-center bg-slate-800 p-1 rounded-2xl border border-slate-700">
            <button
              type="button"
              onClick={() => setInputMode('touch')}
              style={{
                backgroundColor: inputMode === 'touch' ? '#088395' : 'transparent',
                color: inputMode === 'touch' ? '#ffffff' : '#cbd5e1'
              }}
              className="px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
            >
              <Sliders size={14} />
              <span>Touch Buttons</span>
            </button>

            <button
              type="button"
              onClick={() => setInputMode('voice')}
              style={{
                backgroundColor: inputMode === 'voice' ? '#088395' : 'transparent',
                color: inputMode === 'voice' ? '#ffffff' : '#cbd5e1'
              }}
              className="px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
            >
              <Mic size={14} />
              <span>Voice / Speak</span>
            </button>
          </div>
        </div>
      </div>

      {/* Red-Flag Urgent Notification Banner (Shows automatically if critical trigger detected) */}
      {activeRedFlags.length > 0 && (
        <div className="bg-red-50 border-2 border-red-400 p-4 sm:p-5 rounded-3xl shadow-md space-y-2 pulse-emergency">
          <div className="flex items-start gap-3">
            <ShieldAlert size={26} className="text-red-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-sm font-black text-red-900 uppercase tracking-wide">
                {historyLang === 'hi' 
                  ? '⚠️ अति आवश्यक सूचना: संभावित गंभीर लक्षण (Red-Flag) पाए गए हैं' 
                  : historyLang === 'te'
                  ? '⚠️ ముఖ్య హెచ్చరిక: సంభావ్య ప్రమాదకర లక్షణాలు గుర్తించబడ్డాయి'
                  : '⚠️ URGENT: Potential Red-Flag Symptoms Detected'}
              </h4>
              <p className="text-xs font-bold text-red-800">
                {activeRedFlags[0][historyLang === 'hi' ? 'titleHi' : historyLang === 'te' ? 'titleTe' : 'titleEn']}
              </p>
              <p className="text-[11px] text-red-700 font-medium">
                {historyLang === 'hi'
                  ? 'कृपया तुरंत अस्पताल के ट्रायज स्टाफ या नर्स को सूचित करें। यह कोई अंतिम निदान नहीं है, बल्कि प्राथमिकता सुरक्षा चेतावनी है।'
                  : historyLang === 'te'
                  ? 'దయచేసి వెంటనే ఆసుపత్రి సిబ్బందికి తెలియజేయండి. ఇది కేవలం అత్యవసర హెచ్చరిక మాత్రమే.'
                  : 'Please alert hospital staff immediately. This is not a diagnosis, but an automated clinical priority safety alert.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* STAGE 1: PRIMARY COMPLAINT SELECTION */}
      {stage === 'select_complaint' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          {/* Main Question Heading */}
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-50 border border-cyan-200 text-cyan-800 text-xs font-bold">
              <Sparkles size={14} />
              <span>Step 1: Chief Complaint / मुख्य समस्या</span>
            </div>

            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading">
              {historyLang === 'hi' 
                ? 'आज आप किस समस्या के लिए अस्पताल आए हैं?' 
                : historyLang === 'te' 
                ? 'ఈ రోజు మీరు ఏ సమస్య కొరకు ఆసుపత్రికి వచ్చారు?' 
                : 'What brings you to the hospital today?'}
            </h3>

            <p className="text-xs sm:text-sm text-slate-500">
              {historyLang === 'hi' 
                ? 'नीचे दिए गए मुख्य लक्षणों में से एक चुनें या बोलकर बताएं:' 
                : historyLang === 'te' 
                ? 'కింది ప్రధాన లక్షణాలలో ఒకదాన్ని ఎంచుకోండి లేదా మాట్లాడి చెప్పండి:' 
                : 'Select your primary reason for consultation to start the adaptive clinical interview:'}
            </p>
          </div>

          {/* 6 Big Touch-Friendly Complaint Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            {primaryComplaints.map((comp) => {
              const title = comp[historyLang] || comp.en;
              const desc = comp[historyLang === 'hi' ? 'descHi' : historyLang === 'te' ? 'descTe' : 'descEn'] || comp.descEn;
              const isSelected = selectedComplaintId === comp.id;

              const iconMap = {
                Heart: Heart,
                Thermometer: Thermometer,
                Brain: Brain,
                Activity: Activity,
                Wind: Wind,
                HelpCircle: HelpCircle
              };
              const IconComp = iconMap[comp.icon] || Activity;

              return (
                <button
                  key={comp.id}
                  type="button"
                  onClick={() => handleSelectPrimaryComplaint(comp)}
                  style={{
                    borderColor: isSelected ? '#088395' : '#e2e8f0',
                    backgroundColor: isSelected ? '#ecfeff' : '#ffffff'
                  }}
                  className="p-5 rounded-3xl border-2 text-left transition-all hover:border-cyan-500 flex flex-col justify-between min-h-[140px] group shadow-sm card-hover relative overflow-hidden"
                >
                  <div className="flex items-start justify-between">
                    <div className={`p-3 rounded-2xl ${isSelected ? 'bg-cyan-600 text-white' : 'bg-slate-100 text-slate-700 group-hover:bg-cyan-50 group-hover:text-cyan-700'}`}>
                      <IconComp size={26} />
                    </div>
                    <ChevronRight size={20} className="text-slate-300 group-hover:text-cyan-600 transition-colors" />
                  </div>

                  <div className="mt-4">
                    <h4 className="text-base font-extrabold text-slate-900 group-hover:text-cyan-800">
                      {title}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 leading-snug">
                      {desc}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Voice Prompt Action */}
          <div className="bg-cyan-50/60 border border-cyan-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => speakText(
                  historyLang === 'hi' 
                    ? 'आज आप किस समस्या के लिए अस्पताल आए हैं? छाती में दर्द, बुखार, सिरदर्द, पेट दर्द या खांसी में से एक चुनें।' 
                    : historyLang === 'te' 
                    ? 'ఈ రోజు మీరు ఏ సమస్య కొరకు ఆసుపత్రికి వచ్చారు?' 
                    : 'What brings you to the hospital today? Please select your chief complaint.'
                )}
                className="p-2.5 bg-white text-cyan-700 rounded-xl border border-cyan-300 shadow-sm hover:bg-cyan-100"
                title="Hear audio question"
              >
                <Volume2 size={20} />
              </button>
              <span className="text-xs font-semibold text-cyan-900">
                {historyLang === 'hi' 
                  ? 'आवाज से सुनना चाहते हैं? स्पीकर बटन दबाएं।' 
                  : historyLang === 'te' 
                  ? 'ప్రశ్న వినడానికి స్పీకర్ బటన్ నొక్కండి.' 
                  : 'Tap speaker to hear audio guidance or tap any card above to proceed.'}
              </span>
            </div>

            <button
              type="button"
              onClick={handleToggleVoiceInput}
              style={{ backgroundColor: isListening ? '#dc2626' : '#088395' }}
              className="px-4 py-2 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-sm whitespace-nowrap"
            >
              <Mic size={16} className={isListening ? 'animate-pulse' : ''} />
              <span>{isListening ? 'Listening...' : 'Speak Your Complaint'}</span>
            </button>
          </div>
        </div>
      )}

      {/* STAGE 2: ADAPTIVE QUESTIONING CONVERSATION FLOW */}
      {stage === 'answering_questions' && currentQuestion && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          {/* Progress Bar & Counter */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handlePrevQuestion}
                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors"
              >
                <ArrowLeft size={16} />
                <span className="hidden sm:inline">Back</span>
              </button>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  {currentQuestion.key}
                </span>
                <p className="text-xs font-bold text-cyan-800">
                  Question {currentQIndex + 1} of {questionsList.length}
                </p>
              </div>
            </div>

            {/* Progress pill */}
            <div className="flex items-center gap-2">
              <div className="w-32 bg-slate-200 h-2 rounded-full overflow-hidden">
                <div 
                  style={{ width: `${((currentQIndex + 1) / questionsList.length) * 100}%`, backgroundColor: '#088395' }}
                  className="h-full transition-all duration-300"
                />
              </div>
              <span className="text-xs font-bold text-slate-600 font-mono">
                {Math.round(((currentQIndex + 1) / questionsList.length) * 100)}%
              </span>
            </div>
          </div>

          {/* Question Card with Audio Speak Trigger */}
          <div className="bg-gradient-to-r from-slate-50 to-cyan-50/50 p-6 rounded-3xl border border-cyan-100 shadow-inner space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <span className="text-[11px] font-extrabold uppercase tracking-wide text-cyan-700 bg-cyan-100/80 px-2.5 py-0.5 rounded-full">
                  Clinical Intake Question
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 leading-snug">
                  {currentQuestion[historyLang] || currentQuestion.en}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => speakCurrentQuestion(currentQuestion)}
                className="p-3 bg-white hover:bg-cyan-50 text-cyan-700 rounded-2xl border border-cyan-200 shadow-sm flex-shrink-0 transition-colors"
                title="Hear question read out"
              >
                <Volume2 size={22} />
              </button>
            </div>

            {currentQuestion.type === 'multi' && (
              <p className="text-xs text-slate-500 font-medium italic">
                (You can select multiple answers that apply / एक से अधिक विकल्प चुन सकते हैं)
              </p>
            )}
          </div>

          {/* Voice Waveform Visualizer (Active when recording) */}
          {voiceWaveform && (
            <div className="bg-cyan-900 text-white p-4 rounded-2xl flex items-center justify-between gap-4 animate-pulse">
              <div className="flex items-center gap-3">
                <Mic size={22} className="text-cyan-300" />
                <div>
                  <p className="text-xs font-bold">Listening to your spoken answer...</p>
                  <p className="text-[11px] text-cyan-200">Speak clearly into the microphone</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-6 bg-cyan-300 rounded-full animate-bounce" />
                <span className="w-1.5 h-10 bg-cyan-300 rounded-full animate-bounce delay-100" />
                <span className="w-1.5 h-4 bg-cyan-300 rounded-full animate-bounce delay-200" />
                <span className="w-1.5 h-8 bg-cyan-300 rounded-full animate-bounce delay-75" />
              </div>
            </div>
          )}

          {/* Interactive Touch Answer Chips (Large Tap Targets) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {currentQuestion.options?.map((option) => {
              const optText = option[historyLang] || option.en;
              const isSelected = currentAnswerList.includes(optText);

              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => handleSelectOption(option)}
                  style={{
                    borderColor: isSelected ? '#088395' : '#e2e8f0',
                    backgroundColor: isSelected ? '#ecfeff' : '#ffffff'
                  }}
                  className="p-4 rounded-2xl border-2 text-left transition-all hover:border-cyan-400 flex items-start gap-3 shadow-sm card-hover"
                >
                  <div
                    style={{
                      backgroundColor: isSelected ? '#088395' : '#ffffff',
                      borderColor: isSelected ? '#088395' : '#cbd5e1'
                    }}
                    className="w-6 h-6 rounded-lg border-2 flex items-center justify-center text-white mt-0.5 flex-shrink-0"
                  >
                    {isSelected && <Check size={16} strokeWidth={3} />}
                  </div>
                  <div className="flex-1">
                    <span className="text-sm font-bold text-slate-800 leading-snug block">
                      {optText}
                    </span>
                    {option.redFlagScore && option.redFlagScore >= 3 && (
                      <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                        <AlertTriangle size={10} />
                        <span>Clinical Priority Factor</span>
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Custom Text / Spoken Answer Input Box */}
          <div className="pt-2">
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Or Speak / Type your own answer:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Type additional details or speak using mic..."
                value={textAnswerInput}
                onChange={(e) => setTextAnswerInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddCustomTextAnswer()}
                className="flex-1 px-4 py-3 bg-slate-50 border border-slate-300 rounded-2xl text-xs sm:text-sm font-medium focus:bg-white focus:border-cyan-600 outline-none"
              />
              <button
                type="button"
                onClick={handleToggleVoiceInput}
                className="px-3.5 py-3 bg-cyan-100 hover:bg-cyan-200 text-cyan-800 rounded-2xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                title="Voice input"
              >
                <Mic size={18} className={isListening ? 'text-red-600 animate-pulse' : ''} />
              </button>
              <button
                type="button"
                onClick={handleAddCustomTextAnswer}
                style={{ backgroundColor: '#088395' }}
                className="px-5 py-3 text-white rounded-2xl text-xs font-bold flex items-center gap-1 shadow hover:opacity-90"
              >
                <span>Save</span>
                <Send size={14} />
              </button>
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={handlePrevQuestion}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft size={16} />
              <span>Previous Question</span>
            </button>

            <button
              type="button"
              onClick={handleNextQuestion}
              style={{ backgroundColor: '#088395' }}
              className="px-6 py-2.5 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-md hover:opacity-95 transition-all"
            >
              <span>{currentQIndex === questionsList.length - 1 ? 'Review History & Finish' : 'Next Question'}</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* STAGE 3: REVIEW & VERIFY COMPLETED HISTORY SCREEN */}
      {stage === 'review_summary' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
            <div>
              <div className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full border border-emerald-300 mb-1">
                <CheckCircle2 size={14} />
                <span>Clinical History Taking Complete</span>
              </div>
              <h3 className="text-2xl font-extrabold text-slate-900 font-heading">
                {historyLang === 'hi' 
                  ? 'मरीज केस हिस्ट्री की समीक्षा करें' 
                  : historyLang === 'te' 
                  ? 'నమోదైన ఆరోగ్య వివరాల సమీక్ష' 
                  : 'Review Clinical Case History'}
              </h3>
              <p className="text-xs text-slate-500">
                Please verify all recorded answers. You can tap on any section to make edits before submitting to the doctor.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  const speechSummary = questionsList
                    .map((q) => `${q.key}: ${(answers[q.id] || []).join(', ')}`)
                    .join('. ');
                  speakText(speechSummary);
                }}
                className="px-4 py-2 bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border border-cyan-300 rounded-xl text-xs font-bold flex items-center gap-1.5"
              >
                <Volume2 size={16} />
                <span>🔊 Listen to Summary</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setStage('select_complaint');
                }}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1"
              >
                <RotateCcw size={14} />
                <span>Restart</span>
              </button>
            </div>
          </div>

          {/* Structured Question-Answer Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {questionsList.map((q, idx) => {
              const ansList = answers[q.id] || ['Not specified'];
              const isFlagged = ansList.some(a => a.includes('severe') || a.includes('Crushing') || a.includes('bleeding') || a.includes('Stroke') || a.includes('Left arm'));

              return (
                <div
                  key={q.id}
                  style={{
                    backgroundColor: isFlagged ? '#fff5f5' : '#f8fafc',
                    borderColor: isFlagged ? '#fecaca' : '#e2e8f0'
                  }}
                  className="p-4 rounded-2xl border flex flex-col justify-between space-y-2 shadow-sm transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                        {q.key}
                      </span>
                      <p className="text-xs font-bold text-slate-800 mt-0.5">
                        {q[historyLang] || q.en}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleEditQuestion(idx)}
                      className="text-cyan-700 hover:text-cyan-900 p-1 rounded hover:bg-cyan-50 transition-colors flex items-center gap-1 text-[11px] font-bold"
                    >
                      <Edit3 size={13} />
                      <span>Edit</span>
                    </button>
                  </div>

                  <div className="pt-1">
                    {ansList.map((ans, aIdx) => (
                      <span
                        key={aIdx}
                        className={`inline-block text-xs font-bold px-2.5 py-1 rounded-lg border mr-1.5 mb-1 ${
                          isFlagged
                            ? 'bg-red-100 text-red-900 border-red-200'
                            : 'bg-white text-slate-900 border-slate-200'
                        }`}
                      >
                        {ans}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Confirmation Action Banner */}
          <div className="bg-gradient-to-r from-slate-900 to-cyan-950 p-6 rounded-3xl text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
            <div>
              <h4 className="text-base font-bold">Save and Continue to Medical Document Upload</h4>
              <p className="text-xs text-cyan-200 mt-0.5">
                All clinical history responses will be formatted into structured FHIR records for Doctor Workstation review.
              </p>
            </div>

            <button
              type="button"
              onClick={saveAndCommitHistory}
              style={{ backgroundColor: '#088395' }}
              className="w-full sm:w-auto px-8 py-3.5 text-white font-bold text-sm rounded-2xl hover:opacity-90 transition-all shadow-lg flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <Check size={18} strokeWidth={3} />
              <span>History Verified & Saved ✓</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
