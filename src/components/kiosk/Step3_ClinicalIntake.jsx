import React, { useState, useEffect } from 'react';
import { 
  Heart, 
  Thermometer, 
  Brain, 
  Activity, 
  Wind, 
  HelpCircle, 
  AlertTriangle, 
  ShieldAlert, 
  Mic, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  Sliders, 
  Pill, 
  AlertOctagon, 
  Check, 
  ChevronRight,
  Info
} from 'lucide-react';
import { usePatient } from '../../context/PatientContext';
import { AudioPrompt } from '../common/AudioPrompt';
import { VoiceInputWidget } from '../common/VoiceInputWidget';
import { 
  primaryComplaints, 
  clinicalQuestionsData, 
  evaluateClinicalRedFlags 
} from '../../data/clinicalFlows';

export const Step3_ClinicalIntake = () => {
  const { 
    kioskForm, 
    setKioskForm, 
    language, 
    t, 
    speakText 
  } = usePatient();

  const [showVoiceWidget, setShowVoiceWidget] = useState(false);
  const [customInput, setCustomInput] = useState(kioskForm.reasonForVisit || kioskForm.customComplaint || '');

  // Chief complaint options
  const complaintOptions = [
    { id: 'chest_pain', title: t.symptomChestPain || 'Chest Pain', desc: 'Chest tightness, pain, pressure or palpitations', icon: Heart },
    { id: 'fever', title: t.symptomFever || 'Fever / Chills', desc: 'High body temperature, shivering or body ache', icon: Thermometer },
    { id: 'headache', title: t.symptomHeadache || 'Headache', desc: 'Throbbing head ache, migraine, or dizziness', icon: Brain },
    { id: 'abdominal_pain', title: t.symptomAbdominalPain || 'Abdominal Pain', desc: 'Stomach ache, nausea, vomiting or cramps', icon: Activity },
    { id: 'cough', title: t.symptomCough || 'Cough / Cold', desc: 'Persistent cough, phlegm, or difficulty breathing', icon: Wind },
    { id: 'back_pain', title: t.symptomBackPain || 'Back Pain', desc: 'Lower or upper back stiffness and spinal pain', icon: Activity },
    { id: 'joint_pain', title: t.symptomJointPain || 'Joint Pain & Arthritis', desc: 'Knee swelling, arthritis, or joint stiffness', icon: Activity },
    { id: 'skin_rash', title: t.symptomSkinRash || 'Skin Rash & Allergy', desc: 'Itchy rash, hives, blisters or skin redness', icon: AlertTriangle },
    { id: 'urinary_trouble', title: t.symptomUrinary || 'Urinary Trouble', desc: 'Burning urination, kidney pain or blood in urine', icon: Activity },
    { id: 'general_weakness', title: t.symptomWeakness || 'Fatigue / Dizziness', desc: 'Severe tiredness, pale skin or body weakness', icon: Heart },
    { id: 'other', title: t.symptomOther || 'Other Complaint', desc: 'General consultation, ENT, or routine refill', icon: HelpCircle }
  ];

  // Helper to infer complaint ID from text
  const inferComplaintId = (text = '') => {
    const r = text.toLowerCase();
    if (r.includes('chest') || r.includes('heart') || r.includes('cardiac') || r.includes('angina') || r.includes('palpitation') || r.includes('सीने') || r.includes('छाती') || r.includes('ఛాతీ') || r.includes('நெஞ்சு')) return 'chest_pain';
    if (r.includes('fever') || r.includes('temperature') || r.includes('chills') || r.includes('बुखार') || r.includes('జ్వరం') || r.includes('காய்ச்சல்')) return 'fever';
    if (r.includes('head') || r.includes('migraine') || r.includes('vertigo') || r.includes('सिर') || r.includes('తల') || r.includes('தலை')) return 'headache';
    if (r.includes('abdom') || r.includes('stomach') || r.includes('vomit') || r.includes('पेट') || r.includes('కడుపు') || r.includes('வயிறு')) return 'abdominal_pain';
    if (r.includes('cough') || r.includes('breath') || r.includes('asthma') || r.includes('खांसी') || r.includes('దగ్గు') || r.includes('இருமல்')) return 'cough';
    if (r.includes('back') || r.includes('spine') || r.includes('sciatica') || r.includes('कमर') || r.includes('నడుము') || r.includes('முதுகு')) return 'back_pain';
    if (r.includes('joint') || r.includes('knee') || r.includes('arthritis') || r.includes('जोड़') || r.includes('కీళ్ల') || r.includes('மூட்டு')) return 'joint_pain';
    if (r.includes('skin') || r.includes('rash') || r.includes('itch') || r.includes('दाने') || r.includes('చర్మం') || r.includes('தோல்')) return 'skin_rash';
    if (r.includes('urin') || r.includes('kidney') || r.includes('पेशाब') || r.includes('మూత్రం') || r.includes('சிறுநீர்')) return 'urinary_trouble';
    if (r.includes('weak') || r.includes('tired') || r.includes('fatigue') || r.includes('थकान') || r.includes('నీరసం') || r.includes('சோர்வு')) return 'general_weakness';
    return 'other';
  };

  const selectedComplaintId = kioskForm.selectedComplaintId || inferComplaintId(kioskForm.reasonForVisit || customInput);

  // Common past conditions & allergies
  const commonConditions = ['Hypertension (High BP)', 'Type 2 Diabetes', 'Asthma / Bronchitis', 'Thyroid Disorder', 'Heart Disease / CAD', 'Kidney Disease', 'None'];
  const commonAllergies = ['Penicillin', 'Sulfa Drugs', 'Aspirin / NSAIDs', 'Paracetamol', 'Dust / Pollen', 'No Known Drug Allergies (NKDA)'];

  // Handle Complaint Selection
  const handleSelectComplaint = (comp) => {
    setCustomInput(comp.title);
    setKioskForm(prev => ({
      ...prev,
      selectedComplaintId: comp.id,
      reasonForVisit: comp.title,
      chiefComplaints: [comp.title]
    }));
  };

  const handleCustomInputChange = (text) => {
    setCustomInput(text);
    const inferred = inferComplaintId(text);
    setKioskForm(prev => ({
      ...prev,
      reasonForVisit: text,
      customComplaint: text,
      selectedComplaintId: inferred,
      chiefComplaints: text.trim() ? [text.trim()] : []
    }));
  };

  // Toggle checklist items
  const toggleCondition = (cond) => {
    setKioskForm(prev => {
      const current = prev.pastConditions || [];
      const updated = current.includes(cond) ? current.filter(c => c !== cond) : [...current, cond];
      return { ...prev, pastConditions: updated };
    });
  };

  const toggleAllergy = (allg) => {
    setKioskForm(prev => {
      const current = prev.allergies || [];
      const updated = current.includes(allg) ? current.filter(a => a !== allg) : [...current, allg];
      return { ...prev, allergies: updated };
    });
  };

  // Measure IoT vitals with realistic medical sensor readings
  const handleCaptureVitals = () => {
    setKioskForm(prev => ({
      ...prev,
      vitals: {
        bpSystolic: '124',
        bpDiastolic: '82',
        pulse: '76',
        spo2: '98',
        temp: '98.6',
        respiratoryRate: '16',
        bloodSugar: '110',
        weight: '68',
        height: '172',
        bmi: '23.0'
      }
    }));
  };

  // -------------------------------------------------------------
  // ACTIVE REAL-TIME RED FLAG EVALUATION (INLINE ENGINE)
  // -------------------------------------------------------------
  const [activeRedFlags, setActiveRedFlags] = useState([]);

  useEffect(() => {
    const flags = [];

    // 1. Text / symptom pattern red flags
    const currentText = `${kioskForm.reasonForVisit || ''} ${kioskForm.customComplaint || ''} ${(kioskForm.chiefComplaints || []).join(' ')}`.toLowerCase();
    
    if (currentText.includes('crushing chest') || currentText.includes('radiating to jaw') || currentText.includes('radiating to left arm') || currentText.includes('heart attack') || (selectedComplaintId === 'chest_pain' && kioskForm.painScore >= 8)) {
      flags.push('Acute Coronary Syndrome: Severe / Crushing chest pain radiating to arm/jaw.');
    }
    if (currentText.includes('sudden worst headache') || currentText.includes('thunderclap') || currentText.includes('facial droop') || currentText.includes('slurred speech')) {
      flags.push('Neurological Emergency: Suspected Subarachnoid Hemorrhage / Acute Stroke.');
    }
    if (currentText.includes('severe breathlessness') || currentText.includes('unable to speak in sentences') || currentText.includes('blue lips')) {
      flags.push('Acute Respiratory Distress: Severe shortness of breath.');
    }
    if (currentText.includes('coughing blood') || currentText.includes('hemoptysis')) {
      flags.push('Hemoptysis Alert: Active blood in sputum.');
    }
    if (currentText.includes('blackout') || currentText.includes('syncope') || currentText.includes('fainted')) {
      flags.push('Syncope / Hemodynamic Instability Alert.');
    }

    // 2. Vitals-driven red flags
    const v = kioskForm.vitals || {};
    const bpSys = Number(v.bpSystolic);
    const bpDia = Number(v.bpDiastolic);
    const pulse = Number(v.pulse);
    const spo2 = Number(v.spo2);
    const temp = Number(v.temp);

    if (spo2 && spo2 < 92) {
      flags.push(`Critical Hypoxia: SpO2 measured at ${spo2}% (< 92%).`);
    }
    if (bpSys && (bpSys >= 180 || bpSys <= 85)) {
      flags.push(`Hemodynamic Warning: Extreme Systolic Blood Pressure (${bpSys} mmHg).`);
    }
    if (pulse && (pulse >= 130 || pulse <= 42)) {
      flags.push(`Arrhythmia Warning: Severe pulse deviation (${pulse} bpm).`);
    }
    if (temp && temp >= 103.5) {
      flags.push(`Hyperpyrexia Alert: High fever (${temp}°F).`);
    }

    // 3. Clinical rules engine evaluation
    try {
      const engineRes = evaluateClinicalRedFlags(
        selectedComplaintId, 
        kioskForm.historyAnswers || {}, 
        kioskForm.vitals || {}
      );
      if (engineRes?.redFlags && engineRes.redFlags.length > 0) {
        engineRes.redFlags.forEach(f => {
          const text = typeof f === 'string' ? f : (f.titleEn || f.title || String(f));
          if (!flags.includes(text)) flags.push(text);
        });
      }
    } catch {}

    const uniqueFlags = Array.from(new Set(flags));
    setActiveRedFlags(uniqueFlags);

    // Synchronize to kioskForm state for backend transmission
    setKioskForm(prev => {
      const hasFlags = uniqueFlags.length > 0;
      const newTriageLevel = hasFlags ? 1 : (Number(prev.painScore) >= 7 ? 2 : 4);
      const newCategory = hasFlags 
        ? 'High Clinical Priority (Red Flag)' 
        : (newTriageLevel === 2 ? 'Urgent / Priority' : 'Routine / Standard (Green)');
      const newColor = hasFlags ? 'red' : (newTriageLevel === 2 ? 'amber' : 'green');

      return {
        ...prev,
        redFlags: uniqueFlags,
        triageLevel: newTriageLevel,
        triageCategory: newCategory,
        triageColor: newColor
      };
    });
  }, [kioskForm.reasonForVisit, kioskForm.customComplaint, kioskForm.painScore, kioskForm.vitals, selectedComplaintId]);

  return (
    <div className="space-y-8">
      {/* Header & Accessibility Audio */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 font-heading flex items-center gap-2">
            <Heart className="text-cyan-700" />
            <span>{t.intakeTitle || 'Reason for Visit & Clinical History'}</span>
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            {t.intakeSub || 'Select or speak your main complaint, answer clinical questions, and record vital signs.'}
          </p>
        </div>

        <AudioPrompt promptText={t.audioPromptClinical || 'Please describe your main health concern, answer clinical questions, and capture your vitals.'} />
      </div>

      {/* ACTIVE INLINE RED FLAG ALERT BANNER (High-Priority Clinician Notice) */}
      {activeRedFlags.length > 0 && (
        <div className="bg-red-50 border-2 border-red-500 rounded-3xl p-5 sm:p-6 shadow-md space-y-3 animate-pulse">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 bg-red-600 text-white rounded-2xl flex-shrink-0 mt-0.5 shadow-xs">
              <ShieldAlert size={26} />
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-red-900 bg-red-100 px-2.5 py-0.5 rounded-full border border-red-300">
                Immediate Clinical Attention Indicated
              </span>
              <h3 className="text-base sm:text-lg font-black text-red-950 font-heading">
                {t.redFlagBannerTitle || '⚠️ Clinical Priority Alert: Urgent Medical Attention Indicated'}
              </h3>
              <p className="text-xs text-red-900 leading-relaxed font-semibold">
                {t.redFlagBannerSub || 'Your reported symptoms indicate potential risk factors. Your case has been flagged as High Priority for the attending care team.'}
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-red-200/80 space-y-1.5 pl-1">
            <span className="text-[11px] font-bold text-red-950 uppercase tracking-wider block">
              Flagged Priority Clinical Indicators:
            </span>
            {activeRedFlags.map((flag, idx) => (
              <div key={idx} className="bg-white p-2.5 rounded-xl border border-red-200 text-xs font-bold text-red-900 flex items-center gap-2 shadow-2xs">
                <AlertTriangle size={15} className="text-red-600 flex-shrink-0" />
                <span>{flag}</span>
              </div>
            ))}
            <p className="text-[11px] text-red-800 font-bold pt-1">
              {t.redFlagActionNotice || 'Please inform nursing or triage staff at the desk immediately if you feel breathless, faint, or severe discomfort.'}
            </p>
          </div>
        </div>
      )}

      {/* SECTION 1: CHIEF COMPLAINT SELECTION */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
            1. {t.chiefComplaintTitle || 'Primary Reason for Visit'} *
          </label>
          <button
            type="button"
            onClick={() => setShowVoiceWidget(!showVoiceWidget)}
            className="text-xs font-bold text-cyan-800 bg-cyan-50 hover:bg-cyan-100 px-3 py-1.5 rounded-xl border border-cyan-200 flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Mic size={14} className={showVoiceWidget ? 'text-red-600' : 'text-cyan-700'} />
            <span>{showVoiceWidget ? 'Hide Voice Input' : (t.speakComplaint || 'Speak Symptoms')}</span>
          </button>
        </div>

        {/* Voice Input Widget (Switches automatically to active Indian language) */}
        {showVoiceWidget && (
          <VoiceInputWidget
            languageKey={language}
            currentValue={customInput}
            onTranscriptConfirmed={(spokenText) => {
              handleCustomInputChange(spokenText);
            }}
          />
        )}

        {/* Primary Complaint Cards (Interactive Touch Grid) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
          {complaintOptions.map((comp) => {
            const isSelected = selectedComplaintId === comp.id;
            const Icon = comp.icon;
            return (
              <button
                key={comp.id}
                type="button"
                onClick={() => handleSelectComplaint(comp)}
                style={{
                  backgroundColor: isSelected ? '#ecfeff' : '#ffffff',
                  borderColor: isSelected ? '#088395' : '#e2e8f0',
                  boxShadow: isSelected ? '0 4px 14px 0 rgba(8, 131, 149, 0.15)' : 'none'
                }}
                className={`p-3.5 rounded-2xl border-2 text-left transition-all flex flex-col justify-between min-h-[95px] cursor-pointer hover:border-cyan-500 card-hover ${
                  isSelected ? 'ring-2 ring-cyan-200' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div 
                    style={{ backgroundColor: isSelected ? '#088395' : '#f1f5f9', color: isSelected ? '#ffffff' : '#475569' }}
                    className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors"
                  >
                    <Icon size={16} />
                  </div>
                  {isSelected && <Check size={16} strokeWidth={3} className="text-cyan-700" />}
                </div>
                <div className="mt-2">
                  <h4 className="text-xs font-bold text-slate-900 leading-tight">{comp.title}</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{comp.desc}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Custom Problem Text Input */}
        <div className="pt-2">
          <input
            type="text"
            value={customInput}
            onChange={(e) => handleCustomInputChange(e.target.value)}
            placeholder={t.customComplaintPlaceholder || 'Describe your symptoms in your own words, or tap the microphone to speak...'}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-2xl text-xs sm:text-sm font-semibold focus:bg-white focus:border-cyan-700 focus:outline-none transition-colors"
          />
        </div>
      </div>

      {/* SECTION 2: DURATION & PAIN SCALE */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
        {/* Duration */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-3 shadow-xs">
          <label className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <Clock size={15} className="text-cyan-700" />
            <span>2. {t.duration || 'Duration of Problem'}</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: '< 24 hours', label: t.durationToday || 'Today (< 24 hrs)' },
              { id: '1 to 3 days', label: t.durationDays || '1 to 3 Days' },
              { id: 'About 1 week', label: t.durationWeek || 'About a Week' },
              { id: '> 1 month', label: t.durationMonth || 'Over a Month' }
            ].map(d => {
              const isSelected = kioskForm.duration === d.id;
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setKioskForm(p => ({ ...p, duration: d.id }))}
                  style={{
                    backgroundColor: isSelected ? '#088395' : '#f8fafc',
                    color: isSelected ? '#ffffff' : '#1e293b',
                    borderColor: isSelected ? '#088395' : '#cbd5e1'
                  }}
                  className="p-2.5 rounded-xl border text-xs font-bold text-center cursor-pointer transition-all hover:border-cyan-600"
                >
                  {d.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Pain Severity Rating (1 to 10) */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <label className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Sliders size={15} className="text-cyan-700" />
              <span>3. {t.painSeverity || 'Pain / Discomfort Severity'}</span>
            </label>
            <span className={`text-xs font-black px-2.5 py-0.5 rounded-full border ${
              kioskForm.painScore >= 7 ? 'bg-red-100 text-red-800 border-red-300' :
              kioskForm.painScore >= 4 ? 'bg-amber-100 text-amber-800 border-amber-300' :
              'bg-emerald-100 text-emerald-800 border-emerald-300'
            }`}>
              {kioskForm.painScore || 0} / 10 ({
                kioskForm.painScore >= 7 ? (t.severe || 'Severe') :
                kioskForm.painScore >= 4 ? (t.moderate || 'Moderate') :
                (t.mild || 'Mild')
              })
            </span>
          </div>

          <input
            type="range"
            min="0"
            max="10"
            value={kioskForm.painScore || 0}
            onChange={(e) => setKioskForm(p => ({ ...p, painScore: Number(e.target.value) }))}
            className="w-full accent-cyan-700 cursor-pointer h-2 bg-slate-200 rounded-lg"
          />

          <div className="flex justify-between text-[11px] font-bold text-slate-400 px-1">
            <span>0 (None)</span>
            <span>3 (Mild)</span>
            <span>6 (Moderate)</span>
            <span>10 (Severe)</span>
          </div>
        </div>
      </div>

      {/* SECTION 3: PAST CONDITIONS, ALLERGIES & MEDICATIONS */}
      <div className="space-y-4 pt-2">
        <label className="text-xs font-extrabold text-slate-800 uppercase tracking-wider block">
          4. {t.pastHistoryTitle || 'Medical History & Prior Conditions'}
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Past Conditions */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2.5">
            <h4 className="text-xs font-bold text-slate-700">{t.pastConditions || 'Known Past Medical Conditions'}:</h4>
            <div className="flex flex-wrap gap-1.5">
              {commonConditions.map(cond => {
                const isSelected = (kioskForm.pastConditions || []).includes(cond);
                return (
                  <button
                    key={cond}
                    type="button"
                    onClick={() => toggleCondition(cond)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      isSelected 
                        ? 'bg-cyan-700 text-white border-cyan-700 font-bold' 
                        : 'bg-white text-slate-700 border-slate-300 hover:border-cyan-600'
                    }`}
                  >
                    {cond}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Allergies */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2.5">
            <h4 className="text-xs font-bold text-slate-700">{t.allergies || 'Known Drug Allergies'}:</h4>
            <div className="flex flex-wrap gap-1.5">
              {commonAllergies.map(allg => {
                const isSelected = (kioskForm.allergies || []).includes(allg);
                return (
                  <button
                    key={allg}
                    type="button"
                    onClick={() => toggleAllergy(allg)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      isSelected 
                        ? 'bg-red-700 text-white border-red-700 font-bold' 
                        : 'bg-white text-slate-700 border-slate-300 hover:border-red-400'
                    }`}
                  >
                    {allg}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 4: IOT VITALS MEASUREMENT */}
      <div className="bg-slate-900 text-white rounded-3xl p-5 sm:p-6 space-y-4 shadow-lg border border-cyan-500/30">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <Activity size={20} className="text-cyan-400" />
            <div>
              <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
                5. {t.vitalsCheck || 'Kiosk IoT Vitals Measurement (Auto-Connect)'}
              </h3>
              <p className="text-[11px] text-slate-400">
                Connected Bluetooth/IoT pulse oximeter and digital blood pressure cuff.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCaptureVitals}
            className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-2 transition-all cursor-pointer shadow-md"
          >
            <Activity size={15} />
            <span>{t.measureVitals || 'Capture Vitals Now'}</span>
          </button>
        </div>

        {/* Real Vitals Readings */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">{t.bp || 'Blood Pressure'}</span>
            <span className="text-lg font-black text-cyan-300 font-mono">
              {kioskForm.vitals.bpSystolic ? `${kioskForm.vitals.bpSystolic}/${kioskForm.vitals.bpDiastolic}` : '-- / --'}
            </span>
            <span className="text-[10px] text-slate-500 block">mmHg</span>
          </div>

          <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">{t.pulse || 'Pulse Rate'}</span>
            <span className="text-lg font-black text-cyan-300 font-mono">
              {kioskForm.vitals.pulse || '--'}
            </span>
            <span className="text-[10px] text-slate-500 block">bpm</span>
          </div>

          <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">{t.spo2 || 'Oxygen (SpO2)'}</span>
            <span className="text-lg font-black text-cyan-300 font-mono">
              {kioskForm.vitals.spo2 ? `${kioskForm.vitals.spo2}%` : '-- %'}
            </span>
            <span className="text-[10px] text-slate-500 block">Room Air</span>
          </div>

          <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">{t.temp || 'Temperature'}</span>
            <span className="text-lg font-black text-cyan-300 font-mono">
              {kioskForm.vitals.temp ? `${kioskForm.vitals.temp}°F` : '-- °F'}
            </span>
            <span className="text-[10px] text-slate-500 block">Axillary</span>
          </div>

          <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700 col-span-2 sm:col-span-1">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">{t.bloodSugar || 'Random Sugar'}</span>
            <span className="text-lg font-black text-cyan-300 font-mono">
              {kioskForm.vitals.bloodSugar ? `${kioskForm.vitals.bloodSugar}` : '--'}
            </span>
            <span className="text-[10px] text-slate-500 block">mg/dL</span>
          </div>
        </div>
      </div>
    </div>
  );
};
