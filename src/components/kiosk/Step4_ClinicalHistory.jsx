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
  Radio,
  FileText,
  Pill,
  AlertOctagon,
  User,
  Clock
} from 'lucide-react';
import { usePatient } from '../../context/PatientContext';
import { AudioPrompt } from '../common/AudioPrompt';
import { VoiceInputWidget } from '../common/VoiceInputWidget';
import { matchSpokenTextToOptions } from '../../services/speechService';
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

  // Active sub-language for history taking
  const [historyLang, setHistoryLang] = useState(() => {
    return ['en', 'hi', 'te'].includes(language) ? language : 'en';
  });

  const [showVoiceWidget, setShowVoiceWidget] = useState(false);

  // Resolve complaint ID from Step 2 selection or custom reason for visit text
  const resolveComplaintId = () => {
    if (kioskForm.selectedComplaintId && clinicalQuestionsData[kioskForm.selectedComplaintId]) {
      return kioskForm.selectedComplaintId;
    }
    const r = (kioskForm.reasonForVisit || kioskForm.customComplaint || '').toLowerCase();
    
    // Chest / Heart
    if (r.includes('chest') || r.includes('heart') || r.includes('cardiac') || r.includes('angina') || r.includes('palpitation') || r.includes('सीने') || r.includes('छाती') || r.includes('గుండె') || r.includes('ఛాతీ')) {
      return 'chest_pain';
    }
    // Fever / Infection
    if (r.includes('fever') || r.includes('temperature') || r.includes('chills') || r.includes('dengue') || r.includes('malaria') || r.includes('typhoid') || r.includes('बुखार') || r.includes('ताप') || r.includes('జ్వరం')) {
      return 'fever';
    }
    // Headache / Migraine / Neurological
    if (r.includes('headache') || r.includes('head') || r.includes('migraine') || r.includes('vertigo') || r.includes('सिरदर्द') || r.includes('తలనొప్పి')) {
      return 'headache';
    }
    // Abdominal / Stomach / GI
    if (r.includes('abdom') || r.includes('stomach') || r.includes('belly') || r.includes('vomit') || r.includes('nausea') || r.includes('acidity') || r.includes('gastric') || r.includes('diarrhea') || r.includes('loose motion') || r.includes('पेट') || r.includes('కడుపు')) {
      return 'abdominal_pain';
    }
    // Cough / Respiratory / Cold
    if (r.includes('cough') || r.includes('breath') || r.includes('asthma') || r.includes('wheez') || r.includes('sputum') || r.includes('phlegm') || r.includes('cold') || r.includes('खांसी') || r.includes('దగ్గు')) {
      return 'cough';
    }
    // Back / Spine / Sciatica
    if (r.includes('back') || r.includes('spine') || r.includes('lumbar') || r.includes('sciatica') || r.includes('disc') || r.includes('waist') || r.includes('कमर') || r.includes('पीठ') || r.includes('నడుము')) {
      return 'back_pain';
    }
    // Joint / Knee / Ortho
    if (r.includes('joint') || r.includes('knee') || r.includes('arthritis') || r.includes('gout') || r.includes('uric') || r.includes('shoulder') || r.includes('ankle') || r.includes('जोड़') || r.includes('घुटने') || r.includes('కీళ్ల') || r.includes('మోకాళ్ల')) {
      return 'joint_pain';
    }
    // Skin / Rash / Allergy / Dermatology
    if (r.includes('skin') || r.includes('rash') || r.includes('itch') || r.includes('allergy') || r.includes('blister') || r.includes('hives') || r.includes('त्वचा') || r.includes('खुजली') || r.includes('दाने') || r.includes('చర్మం') || r.includes('దురద')) {
      return 'skin_rash';
    }
    // Urinary / Kidney / Stones
    if (r.includes('urin') || r.includes('burning') || r.includes('kidney') || r.includes('stone') || r.includes('bladder') || r.includes('prostate') || r.includes('पेशाब') || r.includes('पथरी') || r.includes('మూత్రం') || r.includes('కిడ్నీ')) {
      return 'urinary_trouble';
    }
    // Weakness / Fatigue / Dizziness
    if (r.includes('weak') || r.includes('tired') || r.includes('fatigue') || r.includes('dizz') || r.includes('anemia') || r.includes('sugar') || r.includes('कमजोरी') || r.includes('थकान') || r.includes('चक्कर') || r.includes('నీరసం') || r.includes('అలసట')) {
      return 'general_weakness';
    }

    return 'other';
  };

  const [selectedComplaintId, setSelectedComplaintId] = useState(resolveComplaintId);
  const [customComplaintText, setCustomComplaintText] = useState(kioskForm.customComplaint || kioskForm.reasonForVisit || '');

  // Input method mode: 'touch' | 'voice'
  const [inputMode, setInputMode] = useState('touch');
  const [isListening, setIsListening] = useState(false);
  const [voiceWaveform, setVoiceWaveform] = useState(false);

  // Conversation stage:
  // Since Step 2 already selected the Reason for Visit, Step 3 defaults directly to 'answering_questions' (detailed history)
  const [stage, setStage] = useState(() => {
    return kioskForm.structuredHistory && kioskForm.structuredHistory.length > 0
      ? 'review_summary'
      : 'answering_questions';
  });

  const [currentQIndex, setCurrentQIndex] = useState(0);

  // Store patient's answers: { questionId: [selectedAnswersArray] }
  const [answers, setAnswers] = useState(() => {
    return kioskForm.historyAnswers || {};
  });

  // Free text input for custom answers / speech transcripts
  const [textAnswerInput, setTextAnswerInput] = useState('');
  
  // Real-time red flag alerts
  const [activeRedFlags, setActiveRedFlags] = useState([]);

  // Synchronize language if global language changes to en, hi, or te
  useEffect(() => {
    if (['en', 'hi', 'te'].includes(language)) {
      setHistoryLang(language);
    }
  }, [language]);

  // Keep selected complaint synced if changed in context
  useEffect(() => {
    const resolved = resolveComplaintId();
    setSelectedComplaintId(resolved);
  }, [kioskForm.selectedComplaintId, kioskForm.reasonForVisit]);

  const questionsList = clinicalQuestionsData[selectedComplaintId] || clinicalQuestionsData.other || clinicalQuestionsData.chest_pain;
  const currentQuestion = questionsList[currentQIndex] || questionsList[0];

  // Auto-evaluate red flags and keep PatientContext kioskForm synchronized on ANY answer selection
  useEffect(() => {
    const { redFlags } = evaluateClinicalRedFlags(selectedComplaintId, answers);
    setActiveRedFlags(redFlags);
    if (answers && Object.keys(answers).length > 0) {
      saveAndCommitHistory(answers);
    }
  }, [answers, selectedComplaintId, historyLang]);

  // Voice narration helper when a new question loads
  const speakCurrentQuestion = (qObj) => {
    if (!qObj) return;
    const prompt = qObj[historyLang] || qObj.en;
    speakText(prompt, historyLang === 'hi' ? 'hi-IN' : historyLang === 'te' ? 'te-IN' : 'en-IN');
  };

  // Switch primary complaint if needed
  const handleSelectPrimaryComplaint = (complaint) => {
    setSelectedComplaintId(complaint.id);
    setKioskForm(prev => ({
      ...prev,
      selectedComplaintId: complaint.id,
      reasonForVisit: complaint[historyLang] || complaint.en
    }));
    setAnswers({});
    setCurrentQIndex(0);
    setStage('answering_questions');
  };

  // Select answer option for current question
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
    handleVoiceAnswerConfirmed(textAnswerInput.trim(), true);
    setTextAnswerInput('');
  };

  // Real Voice Answer Handler
  const handleVoiceAnswerConfirmed = (spokenTranscript, shouldAdvance = false) => {
    if (!spokenTranscript || !currentQuestion) return;
    
    setTextAnswerInput(spokenTranscript);
    
    // Match spoken text against question options
    const matchResult = matchSpokenTextToOptions(spokenTranscript, currentQuestion.options, historyLang);
    
    setAnswers((prev) => {
      const existing = prev[currentQuestion.id] || [];
      let updatedAnswers = [...existing];

      if (matchResult.matchedOption) {
        const optText = matchResult.matchedOption[historyLang] || matchResult.matchedOption.en;
        if (!updatedAnswers.includes(optText)) {
          updatedAnswers = currentQuestion.type === 'multi' ? [...updatedAnswers, optText] : [optText];
        }
      } else {
        // Store verbatim spoken transcript
        if (!updatedAnswers.includes(spokenTranscript)) {
          updatedAnswers = currentQuestion.type === 'multi' ? [...updatedAnswers, spokenTranscript] : [spokenTranscript];
        }
      }

      return {
        ...prev,
        [currentQuestion.id]: updatedAnswers
      };
    });

    if (shouldAdvance) {
      setTimeout(() => {
        handleNextQuestion();
      }, 400);
    }
  };

  const handleNextQuestion = () => {
    if (currentQIndex < questionsList.length - 1) {
      const nextIdx = currentQIndex + 1;
      setCurrentQIndex(nextIdx);
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
    } else {
      setStage('select_complaint');
    }
  };

  // Convert answers to structured summary and commit to PatientContext
  const saveAndCommitHistory = (currentAnswers = answers) => {
    const selectedComp = primaryComplaints.find((c) => c.id === selectedComplaintId) || primaryComplaints[0];
    const compTitle = selectedComp[historyLang] || selectedComp.en;

    // Build structured question-answer pairs
    const structuredPairs = questionsList.map((q) => {
      const ansList = currentAnswers[q.id] || [];
      return {
        questionId: q.id,
        category: q.key,
        question: q[historyLang] || q.en,
        answers: ansList.length > 0 ? ansList : ['Not specified']
      };
    });

    // Extract past history, duration, severity, allergies
    let extractedDuration = kioskForm.duration || '2-3 Days';
    let extractedPainScore = 5;
    const extractedPastConds = [];
    const extractedAllergies = [];
    const extractedMeds = [];

    // Search answers for duration & conditions
    Object.keys(currentAnswers).forEach((k) => {
      const ansArr = currentAnswers[k] || [];
      const text = ansArr.join(' ');
      if (text.includes('1 hour') || text.includes('hours ago') || text.includes('Today') || text.includes('आज') || text.includes('ఈ రోజు')) {
        extractedDuration = 'Started Today (< 6 hours)';
      } else if (text.includes('2 to 3 days') || text.includes('1 to 2 days') || text.includes('दिन') || text.includes('రోజు')) {
        extractedDuration = '2 to 3 Days';
      } else if (text.includes('week') || text.includes('weeks') || text.includes('हफ्ता') || text.includes('వారం')) {
        extractedDuration = '> 1 Week';
      }

      if (text.includes('1-3')) extractedPainScore = 2;
      if (text.includes('4-6')) extractedPainScore = 5;
      if (text.includes('7-8')) extractedPainScore = 8;
      if (text.includes('9-10') || text.includes('Unbearable') || text.includes('असहनीय') || text.includes('భరించలేని')) extractedPainScore = 9;

      if (text.includes('Diabetes') || text.includes('शुगर') || text.includes('షుగర్')) extractedPastConds.push('Type 2 Diabetes Mellitus');
      if (text.includes('Blood Pressure') || text.includes('बीपी') || text.includes('బీపీ')) extractedPastConds.push('Essential Hypertension');
      if (text.includes('Heart Attack') || text.includes('हार्ट अटैक') || text.includes('హార్ట్ ఎటాక్')) extractedPastConds.push('Coronary Artery Disease (CAD)');

      if (text.includes('Penicillin') || text.includes('पेनिसिलिन') || text.includes('పెన్సిలిన్')) extractedAllergies.push('Penicillin / Amoxicillin');
      if (text.includes('Painkillers') || text.includes('Diclofenac') || text.includes('డైక్లోఫెనాక్')) extractedAllergies.push('NSAIDs (Diclofenac / Ibuprofen)');
      if (text.includes('Sulfa') || text.includes('सल्फा') || text.includes('సల్ఫా')) extractedAllergies.push('Sulfa Drugs');

      if (text.includes('Blood Pressure tablets') || text.includes('बीपी की गोलियां') || text.includes('బీపీ మాత్రలు')) extractedMeds.push('Tab. Telmisartan 40mg (1-0-0)');
      if (text.includes('Diabetes medicines') || text.includes('डायबिटीज') || text.includes('షుగర్ మందులు')) extractedMeds.push('Tab. Metformin 500mg (1-0-1)');
      if (text.includes('Blood thinners') || text.includes('खून पतला') || text.includes('రక్తం పల్చబడే')) extractedMeds.push('Tab. Ecosprin 75mg (0-1-0)');
    });

    const complaintSummary = kioskForm.reasonForVisit || compTitle;

    // Extract red flag titles
    const { redFlags } = evaluateClinicalRedFlags(selectedComplaintId, currentAnswers);
    const redFlagTitles = redFlags.map((rf) => 
      typeof rf === 'string' ? rf : (rf[historyLang === 'hi' ? 'titleHi' : historyLang === 'te' ? 'titleTe' : 'titleEn'] || rf.titleEn || rf.details)
    );

    setActiveRedFlags(redFlags);

    const hasCritical = redFlags.some(r => r.level === 'CRITICAL');
    const hasFlags = redFlagTitles.length > 0;

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
      historyAnswers: currentAnswers,
      structuredHistory: structuredPairs,
      redFlags: redFlagTitles,
      triageLevel: hasCritical ? 1 : (hasFlags ? 2 : 4),
      triageCategory: hasCritical ? 'Resuscitation / Immediate Priority' : (hasFlags ? 'High Clinical Priority (Red Flag)' : 'Routine (Green)'),
      triageColor: (hasCritical || hasFlags) ? 'red' : 'green'
    }));
  };

  const handleEditQuestion = (qIndex) => {
    setCurrentQIndex(qIndex);
    setStage('answering_questions');
  };

  const currentAnswerList = currentQuestion ? (answers[currentQuestion.id] || []) : [];
  const selectedCompObj = primaryComplaints.find(c => c.id === selectedComplaintId) || primaryComplaints[0];
  const complaintDisplayTitle = kioskForm.reasonForVisit || selectedCompObj[historyLang] || selectedCompObj.en;

  return (
    <div className="space-y-6">
      {/* Clean Consistent Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 font-heading flex items-center gap-2">
            <Heart className="text-cyan-700" />
            <span>Medical History & Symptom Details</span>
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Please answer a few questions regarding your symptom duration, severity, and past medical history.
          </p>
        </div>
        <AudioPrompt promptText="Please answer the following questions regarding your symptom duration, severity, and medical history." />
      </div>

      {/* Patient Context Summary Bar */}
      <div className="bg-cyan-50 border border-cyan-200 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <span className="font-bold text-cyan-950 flex items-center gap-1.5">
            <Activity size={15} className="text-cyan-700" />
            <span>Chief Complaint:</span>
            <strong className="text-cyan-900 bg-white px-2 py-0.5 rounded-lg border border-cyan-200 shadow-2xs">
              {complaintDisplayTitle}
            </strong>
          </span>

          {kioskForm.name && (
            <span className="text-slate-600 font-semibold flex items-center gap-1">
              <User size={13} className="text-slate-400" />
              <span>{kioskForm.name} ({kioskForm.age ? `${kioskForm.age}y` : ''} {kioskForm.gender})</span>
            </span>
          )}
        </div>

        {stage === 'answering_questions' && (
          <button
            type="button"
            onClick={() => setStage('select_complaint')}
            className="text-[11px] font-bold text-cyan-800 hover:text-cyan-950 underline cursor-pointer"
          >
            Change Chief Complaint
          </button>
        )}
      </div>

      {/* Red-Flag Urgent Notification Banner */}
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
                  : 'Please alert hospital staff immediately. Automated clinical safety flags will be highlighted to the treating doctor.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* STAGE 1: SWITCH COMPLAINT VIEW (Only shown if patient explicitly clicks "Change Chief Complaint") */}
      {stage === 'select_complaint' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-lg font-extrabold text-slate-900 font-heading">
              Select Primary Health Concern to Investigate:
            </h3>
            <button
              type="button"
              onClick={() => setStage('answering_questions')}
              className="text-xs font-bold text-slate-500 hover:text-slate-800"
            >
              Cancel & Return
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {primaryComplaints.map((comp) => {
              const title = comp[historyLang] || comp.en;
              const desc = comp[historyLang === 'hi' ? 'descHi' : historyLang === 'te' ? 'descTe' : 'descEn'] || comp.descEn;
              const isSelected = selectedComplaintId === comp.id;

              return (
                <button
                  key={comp.id}
                  type="button"
                  onClick={() => handleSelectPrimaryComplaint(comp)}
                  style={{
                    borderColor: isSelected ? '#088395' : '#e2e8f0',
                    backgroundColor: isSelected ? '#ecfeff' : '#ffffff'
                  }}
                  className="p-5 rounded-3xl border-2 text-left transition-all hover:border-cyan-500 flex flex-col justify-between min-h-[140px] group shadow-sm cursor-pointer"
                >
                  <div>
                    <h4 className="text-base font-extrabold text-slate-900 group-hover:text-cyan-800">
                      {title}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 leading-snug">
                      {desc}
                    </p>
                  </div>
                  <span className="text-xs font-bold text-cyan-700 mt-3 flex items-center gap-1">
                    <span>Investigate Symptoms</span>
                    <ChevronRight size={14} />
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* STAGE 2: ADAPTIVE QUESTIONING CONVERSATION FLOW */}
      {stage === 'answering_questions' && currentQuestion && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          {/* Progress Bar & Counter */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              {currentQIndex > 0 && (
                <button
                  type="button"
                  onClick={handlePrevQuestion}
                  className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <ArrowLeft size={16} />
                  <span className="hidden sm:inline">Previous Question</span>
                </button>
              )}
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
                  Clinical Intake Detail
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 leading-snug">
                  {currentQuestion[historyLang] || currentQuestion.en}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => speakCurrentQuestion(currentQuestion)}
                className="p-3 bg-white hover:bg-cyan-50 text-cyan-700 rounded-2xl border border-cyan-200 shadow-sm flex-shrink-0 transition-colors cursor-pointer"
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

          {/* Interactive Touch Answer Chips */}
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
                  className="p-4 rounded-2xl border-2 text-left transition-all hover:border-cyan-400 flex items-start gap-3 shadow-sm card-hover cursor-pointer"
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

          {/* Voice Input Widget Toggle & Container */}
          <div className="pt-2 space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700">
                Or Speak / Type your answer in {historyLang === 'hi' ? 'Hindi' : historyLang === 'te' ? 'Telugu' : 'English'}:
              </label>
              <button
                type="button"
                onClick={() => setShowVoiceWidget(!showVoiceWidget)}
                className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  showVoiceWidget ? 'bg-cyan-700 text-white shadow-xs' : 'bg-cyan-50 text-cyan-800 border border-cyan-300 hover:bg-cyan-100'
                }`}
              >
                <Mic size={14} />
                <span>{showVoiceWidget ? 'Close Voice Assistant' : 'Speak Answer (ASR)'}</span>
              </button>
            </div>

            {showVoiceWidget && (
              <VoiceInputWidget
                languageKey={historyLang}
                promptLabel={`Speak your clinical answer clearly in ${historyLang === 'hi' ? 'Hindi' : historyLang === 'te' ? 'Telugu' : 'English'}`}
                currentValue={textAnswerInput}
                onTranscriptConfirmed={(transcript) => {
                  handleVoiceAnswerConfirmed(transcript, true);
                  setShowVoiceWidget(false);
                }}
                onFallbackToText={() => setShowVoiceWidget(false)}
              />
            )}

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Type additional details or speak using mic..."
                value={textAnswerInput}
                onChange={(e) => setTextAnswerInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddCustomTextAnswer()}
                className="flex-1 px-4 py-3 bg-slate-50 border border-slate-300 rounded-2xl text-xs sm:text-sm font-medium focus:bg-white focus:border-cyan-600 outline-none shadow-xs"
              />
              <button
                type="button"
                onClick={() => setShowVoiceWidget(!showVoiceWidget)}
                className="px-3.5 py-3 bg-cyan-100 hover:bg-cyan-200 text-cyan-800 rounded-2xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Voice input"
              >
                <Mic size={18} />
              </button>
              <button
                type="button"
                onClick={handleAddCustomTextAnswer}
                style={{ backgroundColor: '#088395' }}
                className="px-5 py-3 text-white rounded-2xl text-xs font-bold flex items-center gap-1 shadow hover:opacity-90 cursor-pointer"
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
              disabled={currentQIndex === 0}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ArrowLeft size={16} />
              <span>Previous Question</span>
            </button>

            <button
              type="button"
              onClick={handleNextQuestion}
              style={{ backgroundColor: '#088395' }}
              className="px-6 py-2.5 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-md hover:opacity-95 transition-all cursor-pointer"
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
                <span>Medical History Recorded</span>
              </div>
              <h3 className="text-2xl font-extrabold text-slate-900 font-heading">
                {historyLang === 'hi' 
                  ? 'मरीज केस हिस्ट्री की समीक्षा करें' 
                  : historyLang === 'te' 
                  ? 'నమోదైన ఆరోగ్య వివరాల సమీక్ష' 
                  : 'Review Clinical Case History'}
              </h3>
              <p className="text-xs text-slate-500">
                Please verify all recorded answers. You can tap on any section to make edits before submitting.
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
                className="px-4 py-2 bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border border-cyan-300 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Volume2 size={16} />
                <span>🔊 Listen</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setCurrentQIndex(0);
                  setStage('answering_questions');
                }}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw size={14} />
                <span>Retake Questions</span>
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
                      className="text-cyan-700 hover:text-cyan-900 p-1 rounded hover:bg-cyan-50 transition-colors flex items-center gap-1 text-[11px] font-bold cursor-pointer"
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
        </div>
      )}
    </div>
  );
};
