import React, { useState } from 'react';
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
  Check, 
  Send,
  User,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Phone,
  Calendar,
  Save
} from 'lucide-react';
import { usePatient } from '../../context/PatientContext';
import { AudioPrompt } from '../common/AudioPrompt';

export const Step2_ReasonForVisit = () => {
  const { kioskForm, setKioskForm, language, speakText, t } = usePatient();
  const [isListening, setIsListening] = useState(false);
  const [customInput, setCustomInput] = useState(kioskForm.reasonForVisit || '');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [touched, setTouched] = useState(false);

  const commonComplaints = [
    { id: 'chest_pain', title: 'Chest Pain', desc: 'Chest tightness, pain, pressure or palpitations', icon: Heart },
    { id: 'fever', title: 'Fever', desc: 'High body temperature, chills, shivering or body ache', icon: Thermometer },
    { id: 'headache', title: 'Headache', desc: 'Throbbing head ache, migraine, or dizziness', icon: Brain },
    { id: 'abdominal_pain', title: 'Abdominal Pain', desc: 'Stomach ache, nausea, vomiting or cramps', icon: Activity },
    { id: 'cough', title: 'Cough', desc: 'Persistent cough, phlegm, or difficulty breathing', icon: Wind },
    { id: 'back_pain', title: 'Back Pain', desc: 'Lower or upper back stiffness and spinal pain', icon: Activity },
    { id: 'joint_pain', title: 'Joint Pain', desc: 'Knee swelling, arthritis, or morning stiffness', icon: Activity },
    { id: 'skin_rash', title: 'Skin Rash & Allergy', desc: 'Itchy rash, hives, blisters or skin redness', icon: AlertTriangle },
    { id: 'urinary_trouble', title: 'Urinary / Kidney', desc: 'Burning urination, kidney stone pain or blood in urine', icon: Activity },
    { id: 'general_weakness', title: 'Fatigue / Dizziness', desc: 'Severe tiredness, pale skin or body weakness', icon: Heart },
    { id: 'other', title: 'Other Complaint', desc: 'Eye, ENT, general consultation or routine refill', icon: HelpCircle }
  ];

  // Helper to infer complaint ID from custom text
  const inferComplaintId = (text) => {
    if (!text) return 'other';
    const r = text.toLowerCase();
    if (r.includes('chest') || r.includes('heart') || r.includes('cardiac') || r.includes('angina') || r.includes('palpitation')) return 'chest_pain';
    if (r.includes('fever') || r.includes('temperature') || r.includes('chills') || r.includes('dengue') || r.includes('malaria') || r.includes('typhoid')) return 'fever';
    if (r.includes('head') || r.includes('migraine') || r.includes('vertigo')) return 'headache';
    if (r.includes('abdom') || r.includes('stomach') || r.includes('belly') || r.includes('vomit') || r.includes('nausea') || r.includes('acidity') || r.includes('gastric') || r.includes('diarrhea') || r.includes('loose motion')) return 'abdominal_pain';
    if (r.includes('cough') || r.includes('breath') || r.includes('asthma') || r.includes('wheez') || r.includes('sputum') || r.includes('phlegm') || r.includes('cold')) return 'cough';
    if (r.includes('back') || r.includes('spine') || r.includes('lumbar') || r.includes('sciatica') || r.includes('disc') || r.includes('waist')) return 'back_pain';
    if (r.includes('joint') || r.includes('knee') || r.includes('arthritis') || r.includes('gout') || r.includes('uric') || r.includes('shoulder')) return 'joint_pain';
    if (r.includes('skin') || r.includes('rash') || r.includes('itch') || r.includes('allergy') || r.includes('blister') || r.includes('hives')) return 'skin_rash';
    if (r.includes('urin') || r.includes('burning') || r.includes('kidney') || r.includes('stone') || r.includes('bladder')) return 'urinary_trouble';
    if (r.includes('weak') || r.includes('tired') || r.includes('fatigue') || r.includes('dizz') || r.includes('anemia') || r.includes('sugar')) return 'general_weakness';
    return 'other';
  };

  // Validation checks
  const isNameValid = Boolean(kioskForm.name && kioskForm.name.trim().length >= 2);
  const isAgeValid = Boolean(kioskForm.age && Number(kioskForm.age) >= 1 && Number(kioskForm.age) <= 125);
  const isGenderValid = Boolean(kioskForm.gender);
  const isPhoneValid = Boolean(kioskForm.phone && kioskForm.phone.replace(/\D/g, '').length >= 10);
  const isReasonValid = Boolean((customInput && customInput.trim()) || (kioskForm.reasonForVisit && kioskForm.reasonForVisit.trim()));

  const handleSelectComplaint = (comp) => {
    setCustomInput(comp.title);
    setKioskForm(prev => ({
      ...prev,
      selectedComplaintId: comp.id,
      reasonForVisit: comp.title,
      chiefComplaints: [comp.title]
    }));
    setErrorMessage(null);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleApplyCustomText = () => {
    setTouched(true);
    const complaintText = customInput.trim() || kioskForm.reasonForVisit?.trim();

    if (!complaintText) {
      setErrorMessage('Please describe your illness or tap a health concern card above.');
      return;
    }

    if (!isNameValid || !isAgeValid || !isGenderValid || !isPhoneValid) {
      setErrorMessage('Please complete all mandatory patient details (Name, Age, Gender, and 10-digit Phone Number).');
      return;
    }

    const detectedId = inferComplaintId(complaintText);

    setKioskForm(prev => ({
      ...prev,
      selectedComplaintId: detectedId,
      reasonForVisit: complaintText,
      customComplaint: complaintText,
      chiefComplaints: [complaintText]
    }));

    setErrorMessage(null);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3500);
  };

  const handleVoiceInput = () => {
    if (isListening) {
      setIsListening(false);
      return;
    }

    setIsListening(true);
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.lang = language === 'hi' ? 'hi-IN' : language === 'te' ? 'te-IN' : 'en-IN';
        recognition.interimResults = false;
        recognition.onresult = (event) => {
          const text = event.results[0][0].transcript;
          setCustomInput(text);
          setKioskForm(prev => ({
            ...prev,
            selectedComplaintId: 'other',
            reasonForVisit: text,
            chiefComplaints: [text]
          }));
          setIsListening(false);
          setSaveSuccess(true);
          setTimeout(() => setSaveSuccess(false), 3000);
        };
        recognition.onerror = () => {
          setIsListening(false);
        };
        recognition.start();
      } catch {
        setIsListening(false);
      }
    } else {
      setTimeout(() => {
        setIsListening(false);
        const sampleText = 'Severe chest tightness and difficulty breathing';
        setCustomInput(sampleText);
        setKioskForm(prev => ({
          ...prev,
          selectedComplaintId: 'other',
          reasonForVisit: sampleText,
          chiefComplaints: [sampleText]
        }));
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }, 2000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 font-heading flex items-center gap-2">
            <Activity className="text-cyan-700" />
            <span>Reason for Visit & Patient Details</span>
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Please enter the mandatory patient details and describe your main health concern for today's visit.
          </p>
        </div>
        <AudioPrompt promptText="Please enter the mandatory patient identification details and select or describe your illness." />
      </div>

      {/* 1. Mandatory Patient Identification Card */}
      <div className="bg-slate-50 border-2 border-slate-300 rounded-3xl p-5 sm:p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-cyan-700 text-white rounded-xl shadow-2xs">
              <User size={18} />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 font-heading">
                Patient Identification Details <span className="text-red-600 font-black">* (Mandatory)</span>
              </h3>
              <p className="text-xs text-slate-500">
                All 4 fields below are required to generate your hospital consultation case file.
              </p>
            </div>
          </div>

          <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border bg-white text-slate-700 border-slate-300">
            Step 2 of 8
          </span>
        </div>

        {/* Clinical Department / OPD Selection */}
        <div className="pt-2 space-y-2 border-b border-slate-200/80 pb-3">
          <div className="flex items-center justify-between">
            <label className="block text-slate-700 font-bold text-xs">
              Select Clinical Department / OPD Unit <span className="text-red-600">*</span>
            </label>
            {(kioskForm.assignedDepartment?.includes('AYUSH') || kioskForm.assignedDepartment?.includes('Ayurveda')) && (
              <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                🌿 AYUSH / Dashavidha Pariksha Mode Active
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              { id: 'dept-genmed', name: 'General Medicine', icon: '🩺' },
              { id: 'dept-ayush', name: 'AYUSH / Ayurveda', icon: '🌿' },
              { id: 'dept-cardio', name: 'Cardiology', icon: '❤️' },
              { id: 'dept-ortho', name: 'Orthopedics', icon: '🦴' },
              { id: 'dept-ped', name: 'Pediatrics', icon: '👶' },
              { id: 'dept-derm', name: 'Dermatology', icon: '✨' }
            ].map((d) => {
              const isSelected = kioskForm.assignedDepartment === d.name || 
                (d.id === 'dept-ayush' && (kioskForm.assignedDepartment?.includes('AYUSH') || kioskForm.assignedDepartment?.includes('Ayurveda')));

              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => {
                    setKioskForm(prev => ({
                      ...prev,
                      assignedDepartment: d.name,
                      selectedDepartmentName: d.name,
                      selectedDepartmentId: d.id,
                      isAyushCase: d.id === 'dept-ayush'
                    }));
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border flex items-center gap-1.5 ${
                    isSelected
                      ? d.id === 'dept-ayush'
                        ? 'bg-emerald-800 text-white border-emerald-800 shadow-xs'
                        : 'bg-cyan-800 text-white border-cyan-800 shadow-xs'
                      : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-300'
                  }`}
                >
                  <span>{d.icon}</span>
                  <span>{d.name}</span>
                  {isSelected && <CheckCircle2 size={13} className="ml-0.5" />}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5 text-xs font-semibold pt-1">
          {/* Full Name */}
          <div>
            <label className="block text-slate-700 mb-1 font-bold">
              Full Name <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Ramesh Kumar"
              value={kioskForm.name}
              onChange={(e) => {
                setKioskForm(prev => ({ ...prev, name: e.target.value }));
                if (errorMessage) setErrorMessage(null);
              }}
              className={`w-full p-3 bg-white border-2 rounded-xl text-slate-900 font-bold focus:outline-none transition-all ${
                touched && !isNameValid
                  ? 'border-red-400 bg-red-50/50 focus:border-red-600'
                  : isNameValid
                  ? 'border-emerald-400 bg-emerald-50/20 focus:border-cyan-600'
                  : 'border-slate-300 focus:border-cyan-600'
              }`}
            />
            {touched && !isNameValid && (
              <span className="text-[10px] font-bold text-red-600 block mt-1">Full name is required</span>
            )}
          </div>

          {/* Age */}
          <div>
            <label className="block text-slate-700 mb-1 font-bold">
              Age (Years) <span className="text-red-600">*</span>
            </label>
            <input
              type="number"
              required
              min="1"
              max="125"
              placeholder="e.g. 54"
              value={kioskForm.age}
              onChange={(e) => {
                setKioskForm(prev => ({ ...prev, age: e.target.value }));
                if (errorMessage) setErrorMessage(null);
              }}
              className={`w-full p-3 bg-white border-2 rounded-xl text-slate-900 font-bold focus:outline-none transition-all ${
                touched && !isAgeValid
                  ? 'border-red-400 bg-red-50/50 focus:border-red-600'
                  : isAgeValid
                  ? 'border-emerald-400 bg-emerald-50/20 focus:border-cyan-600'
                  : 'border-slate-300 focus:border-cyan-600'
              }`}
            />
            {touched && !isAgeValid && (
              <span className="text-[10px] font-bold text-red-600 block mt-1">Valid age (1–125) is required</span>
            )}
          </div>

          {/* Gender */}
          <div>
            <label className="block text-slate-700 mb-1 font-bold">
              Gender <span className="text-red-600">*</span>
            </label>
            <select
              value={kioskForm.gender || ''}
              onChange={(e) => {
                setKioskForm(prev => ({ ...prev, gender: e.target.value }));
                if (errorMessage) setErrorMessage(null);
              }}
              className={`w-full p-3 bg-white border-2 rounded-xl text-slate-900 font-bold focus:outline-none transition-all cursor-pointer ${
                touched && !isGenderValid
                  ? 'border-red-400 bg-red-50/50 focus:border-red-600'
                  : isGenderValid
                  ? 'border-emerald-400 bg-emerald-50/20 focus:border-cyan-600'
                  : 'border-slate-300 focus:border-cyan-600'
              }`}
            >
              <option value="">-- Select Gender --</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
            {touched && !isGenderValid && (
              <span className="text-[10px] font-bold text-red-600 block mt-1">Please select gender</span>
            )}
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-slate-700 mb-1 font-bold">
              Phone Number (10 Digits) <span className="text-red-600">*</span>
            </label>
            <input
              type="tel"
              required
              maxLength={10}
              placeholder="e.g. 9876543210"
              value={kioskForm.phone}
              onChange={(e) => {
                const cleanPhone = e.target.value.replace(/\D/g, '').slice(0, 10);
                setKioskForm(prev => ({ ...prev, phone: cleanPhone }));
                if (errorMessage) setErrorMessage(null);
              }}
              className={`w-full p-3 bg-white border-2 rounded-xl text-slate-900 font-bold focus:outline-none transition-all ${
                touched && !isPhoneValid
                  ? 'border-red-400 bg-red-50/50 focus:border-red-600'
                  : isPhoneValid
                  ? 'border-emerald-400 bg-emerald-50/20 focus:border-cyan-600'
                  : 'border-slate-300 focus:border-cyan-600'
              }`}
            />
            {touched && !isPhoneValid && (
              <span className="text-[10px] font-bold text-red-600 block mt-1">10-digit mobile number required</span>
            )}
          </div>
        </div>
      </div>

      {/* Success Notification Banner */}
      {saveSuccess && (
        <div className="bg-emerald-50 border-2 border-emerald-400 p-4 rounded-2xl flex items-center justify-between text-emerald-950 font-bold text-xs shadow-xs animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 size={18} className="text-emerald-700 flex-shrink-0" />
            <span>
              <strong>Details Saved Successfully!</strong> Reason for visit: <strong className="text-emerald-900 font-extrabold">{customInput || kioskForm.reasonForVisit}</strong>
            </span>
          </div>
          <span className="bg-emerald-200/80 text-emerald-900 text-[10px] uppercase font-black px-2.5 py-0.5 rounded-full">
            Ready to Continue ✓
          </span>
        </div>
      )}

      {/* Error Notification Banner */}
      {errorMessage && (
        <div className="bg-red-50 border-2 border-red-300 p-4 rounded-2xl flex items-center gap-2.5 text-red-900 font-bold text-xs shadow-xs">
          <AlertCircle size={18} className="text-red-600 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 2. Selectable Touch Complaint Cards */}
      <div className="space-y-3">
        <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
          Or tap a common health concern to auto-fill:
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
          {commonComplaints.map((comp) => {
            const isSelected = kioskForm.selectedComplaintId === comp.id || kioskForm.reasonForVisit === comp.title || customInput === comp.title;
            const IconComp = comp.icon;

            return (
              <button
                key={comp.id}
                type="button"
                onClick={() => handleSelectComplaint(comp)}
                style={{
                  borderColor: isSelected ? '#088395' : '#e2e8f0',
                  backgroundColor: isSelected ? '#f0fdfa' : '#ffffff'
                }}
                className={`p-4 rounded-2xl border-2 text-left transition-all relative flex flex-col justify-between gap-3 group hover:border-cyan-400 hover:shadow-md cursor-pointer ${
                  isSelected ? 'shadow-md ring-2 ring-cyan-500/20' : ''
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div
                      style={{
                        backgroundColor: isSelected ? '#088395' : '#f1f5f9',
                        color: isSelected ? '#ffffff' : '#088395'
                      }}
                      className="p-2.5 rounded-xl font-bold transition-colors"
                    >
                      <IconComp size={20} />
                    </div>

                    {isSelected && (
                      <span className="w-6 h-6 bg-cyan-700 text-white rounded-full flex items-center justify-center shadow-2xs">
                        <Check size={14} strokeWidth={3} />
                      </span>
                    )}
                  </div>

                  <h4 className="text-sm font-extrabold text-slate-900 group-hover:text-cyan-900 transition-colors pt-1">
                    {comp.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                    {comp.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Voice / Text Entry Box (Below the common health concerns) */}
      <div className="bg-white border-2 border-cyan-300 rounded-3xl p-5 sm:p-6 space-y-3.5 shadow-xs">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-extrabold uppercase tracking-wider text-cyan-950">
            Describe your primary illness or reason for visit: <span className="text-red-600">*</span>
          </label>
          {kioskForm.reasonForVisit ? (
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              Active: {kioskForm.reasonForVisit}
            </span>
          ) : (
            <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
              Active: Other complaint
            </span>
          )}
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2.5">
          <input
            type="text"
            value={customInput}
            onChange={(e) => {
              setCustomInput(e.target.value);
              if (errorMessage) setErrorMessage(null);
            }}
            placeholder="e.g. Severe crushing chest pain for 2 hours with cold sweating..."
            className="flex-1 px-4 py-3.5 bg-slate-50 border-2 border-slate-300 rounded-2xl text-sm font-bold text-slate-900 focus:bg-white focus:border-cyan-600 outline-none shadow-2xs"
            onKeyDown={(e) => e.key === 'Enter' && handleApplyCustomText()}
          />

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleVoiceInput}
              style={{ backgroundColor: isListening ? '#dc2626' : '#088395' }}
              className="flex-1 sm:flex-none px-5 py-3.5 text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm hover:opacity-95 cursor-pointer whitespace-nowrap"
              title="Voice input"
            >
              <Mic size={18} className={isListening ? 'animate-pulse' : ''} />
              <span>{isListening ? 'Listening...' : 'Speak'}</span>
            </button>

            <button
              type="button"
              onClick={handleApplyCustomText}
              style={{ backgroundColor: '#0f2b48' }}
              className="flex-1 sm:flex-none px-6 py-3.5 text-white rounded-2xl font-bold text-xs hover:opacity-90 transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <Save size={16} />
              <span>Save Details</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
