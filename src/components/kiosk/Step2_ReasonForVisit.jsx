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
  CheckCircle2
} from 'lucide-react';
import { usePatient } from '../../context/PatientContext';
import { AudioPrompt } from '../common/AudioPrompt';

export const Step2_ReasonForVisit = () => {
  const { kioskForm, setKioskForm, language, speakText, t } = usePatient();
  const [isListening, setIsListening] = useState(false);
  const [customInput, setCustomInput] = useState(kioskForm.reasonForVisit || '');

  const commonComplaints = [
    { id: 'chest_pain', title: 'Chest Pain', desc: 'Chest tightness, pain, pressure or palpitations', icon: Heart },
    { id: 'fever', title: 'Fever', desc: 'High body temperature, chills, shivering or body ache', icon: Thermometer },
    { id: 'headache', title: 'Headache', desc: 'Throbbing head ache, migraine, or dizziness', icon: Brain },
    { id: 'abdominal_pain', title: 'Abdominal Pain', desc: 'Stomach ache, nausea, vomiting or cramps', icon: Activity },
    { id: 'cough', title: 'Cough', desc: 'Persistent cough, phlegm, or difficulty breathing', icon: Wind },
    { id: 'back_pain', title: 'Back Pain', desc: 'Lower or upper back stiffness and spinal pain', icon: Activity },
    { id: 'other', title: 'Other Illness', desc: 'General weakness, skin rash, joint swelling or other', icon: HelpCircle }
  ];

  const handleSelectComplaint = (comp) => {
    setKioskForm(prev => ({
      ...prev,
      selectedComplaintId: comp.id,
      reasonForVisit: comp.title,
      chiefComplaints: [comp.title]
    }));
    setCustomInput(comp.title);
  };

  const handleApplyCustomText = () => {
    if (!customInput.trim()) return;
    setKioskForm(prev => ({
      ...prev,
      reasonForVisit: customInput.trim(),
      chiefComplaints: [customInput.trim()]
    }));
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
            reasonForVisit: text,
            chiefComplaints: [text]
          }));
          setIsListening(false);
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
        setCustomInput('Severe chest tightness and difficulty breathing');
        setKioskForm(prev => ({
          ...prev,
          reasonForVisit: 'Severe chest tightness and difficulty breathing',
          chiefComplaints: ['Severe chest tightness and difficulty breathing']
        }));
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
            <span>What brings you to the hospital today?</span>
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Select your main health concern, speak into the microphone, or type your reason for visit.
          </p>
        </div>
        <AudioPrompt promptText="What brings you to the hospital today? Please select or describe your illness." />
      </div>

      {/* Patient Identification Card (Name, Age, Gender, Phone) */}
      <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5 space-y-4">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-2">
          <User size={16} className="text-cyan-700" />
          <span>Patient Details (Optional or Enter Below)</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs font-semibold">
          <div>
            <label className="block text-slate-600 mb-1">Full Name</label>
            <input
              type="text"
              placeholder="e.g. Ramesh Kumar"
              value={kioskForm.name}
              onChange={(e) => setKioskForm(prev => ({ ...prev, name: e.target.value }))}
              className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-800 font-bold focus:border-cyan-600 outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-600 mb-1">Age (Years)</label>
            <input
              type="number"
              placeholder="54"
              value={kioskForm.age}
              onChange={(e) => setKioskForm(prev => ({ ...prev, age: e.target.value }))}
              className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-800 font-bold focus:border-cyan-600 outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-600 mb-1">Gender</label>
            <select
              value={kioskForm.gender}
              onChange={(e) => setKioskForm(prev => ({ ...prev, gender: e.target.value }))}
              className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-800 font-bold focus:border-cyan-600 outline-none cursor-pointer"
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-600 mb-1">Phone Number</label>
            <input
              type="tel"
              placeholder="9876543210"
              value={kioskForm.phone}
              onChange={(e) => setKioskForm(prev => ({ ...prev, phone: e.target.value }))}
              className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-800 font-bold focus:border-cyan-600 outline-none"
            />
          </div>
        </div>
      </div>

      {/* Voice / Text Entry Box */}
      <div className="bg-white border-2 border-cyan-200 rounded-3xl p-5 space-y-3 shadow-xs">
        <label className="block text-xs font-bold uppercase tracking-wider text-cyan-900">
          Describe your illness or chief complaint:
        </label>
        
        <div className="flex gap-2">
          <input
            type="text"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            placeholder="e.g. Squeezing chest pain for 2 hours with cold sweating..."
            className="flex-1 px-4 py-3 bg-slate-50 border border-slate-300 rounded-2xl text-sm font-semibold text-slate-800 focus:bg-white focus:border-cyan-600 outline-none"
            onKeyDown={(e) => e.key === 'Enter' && handleApplyCustomText()}
          />

          <button
            type="button"
            onClick={handleVoiceInput}
            style={{ backgroundColor: isListening ? '#dc2626' : '#088395' }}
            className="px-4 py-3 text-white rounded-2xl font-bold text-xs flex items-center gap-1.5 transition-colors shadow-sm whitespace-nowrap"
            title="Voice input"
          >
            <Mic size={18} className={isListening ? 'animate-pulse' : ''} />
            <span>{isListening ? 'Listening...' : 'Speak'}</span>
          </button>

          <button
            type="button"
            onClick={handleApplyCustomText}
            className="px-5 py-3 bg-slate-900 text-white rounded-2xl font-bold text-xs hover:bg-slate-800 transition-colors shadow-sm"
          >
            Save
          </button>
        </div>
      </div>

      {/* Selectable Touch Complaint Cards */}
      <div>
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
          Or tap a common health concern:
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
          {commonComplaints.map((comp) => {
            const isSelected = kioskForm.selectedComplaintId === comp.id || kioskForm.reasonForVisit === comp.title;
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
                className={`p-4 rounded-2xl border-2 text-left transition-all relative flex flex-col justify-between gap-3 group hover:border-cyan-400 hover:shadow-md ${
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
                      <CheckCircle2 size={18} className="text-cyan-700" />
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
    </div>
  );
};
