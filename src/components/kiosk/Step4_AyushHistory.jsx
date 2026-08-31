import React, { useState } from 'react';
import { 
  Leaf, 
  Sparkles, 
  Flame, 
  Activity, 
  Brain, 
  Shield, 
  Clock, 
  Sliders, 
  Layers, 
  User, 
  Utensils, 
  AlertCircle, 
  CheckCircle2, 
  Volume2, 
  Info, 
  ChevronRight, 
  ChevronLeft,
  HeartHandshake,
  Mic
} from 'lucide-react';
import { usePatient } from '../../context/PatientContext';
import { AudioPrompt } from '../common/AudioPrompt';
import { VoiceInputWidget } from '../common/VoiceInputWidget';
import { 
  DASHAVIDHA_PARIKSHA_FIELDS, 
  ADDITIONAL_AYUSH_SECTIONS, 
  createInitialAyushState 
} from '../../data/ayushClinicalFlows';

export const Step4_AyushHistory = () => {
  const { kioskForm, setKioskForm, language, speakText, t } = usePatient();
  const [activeTab, setActiveTab] = useState(0); // 0: Dashavidha 1-5, 1: Dashavidha 6-10, 2: Agni & Koshtha, 3: Ahara & Vihara, 4: Nidana & Samprapti
  const [showNidanaVoice, setShowNidanaVoice] = useState(false);
  const [showSampraptiVoice, setShowSampraptiVoice] = useState(false);

  // Ensure ayushHistory exists in kioskForm
  const ayushData = kioskForm.ayushHistory || createInitialAyushState();

  const updateDashavidhaField = (fieldId, key, value) => {
    setKioskForm((prev) => {
      const currentAyush = prev.ayushHistory || createInitialAyushState();
      const currentField = currentAyush.dashavidhaPariksha?.[fieldId] || {};
      
      const updatedField = {
        ...currentField,
        [key]: value
      };

      return {
        ...prev,
        ayushHistory: {
          ...currentAyush,
          dashavidhaPariksha: {
            ...currentAyush.dashavidhaPariksha,
            [fieldId]: updatedField
          }
        }
      };
    });
  };

  const toggleMultiSymptom = (value) => {
    setKioskForm((prev) => {
      const currentAyush = prev.ayushHistory || createInitialAyushState();
      const currentList = currentAyush.dashavidhaPariksha?.vikriti?.primaryImbalanceSymptoms || [];
      const updatedList = currentList.includes(value)
        ? currentList.filter(item => item !== value)
        : [...currentList, value];

      return {
        ...prev,
        ayushHistory: {
          ...currentAyush,
          dashavidhaPariksha: {
            ...currentAyush.dashavidhaPariksha,
            vikriti: {
              ...currentAyush.dashavidhaPariksha?.vikriti,
              primaryImbalanceSymptoms: updatedList
            }
          }
        }
      };
    });
  };

  const updateAdditionalHistory = (sectionKey, subKey, value) => {
    setKioskForm((prev) => {
      const currentAyush = prev.ayushHistory || createInitialAyushState();
      const currentSection = currentAyush.additionalHistory?.[sectionKey];

      let updatedSection;
      if (typeof currentSection === 'object' && currentSection !== null) {
        updatedSection = {
          ...currentSection,
          [subKey]: value
        };
      } else {
        updatedSection = value;
      }

      return {
        ...prev,
        ayushHistory: {
          ...currentAyush,
          additionalHistory: {
            ...currentAyush.additionalHistory,
            [sectionKey]: updatedSection
          }
        }
      };
    });
  };

  const tabs = [
    { id: 0, label: 'Dashavidha (1-5)', subtitle: 'Prakriti, Vikriti, Sara, Samhanana, Pramana' },
    { id: 1, label: 'Dashavidha (6-10)', subtitle: 'Satmya, Sattva, Ahara/Vyayama Shakti, Vaya' },
    { id: 2, label: 'Agni & Koshtha', subtitle: 'Digestive Fire & Bowel Function' },
    { id: 3, label: 'Ahara & Vihara', subtitle: 'Dietary Habits & Daily Regimen' },
    { id: 4, label: 'Nidana & Samprapti', subtitle: 'Causative Triggers & Progression' }
  ];

  const renderFieldIcon = (iconName) => {
    switch (iconName) {
      case 'User': return <User size={20} className="text-emerald-700" />;
      case 'Activity': return <Activity size={20} className="text-emerald-700" />;
      case 'Sparkles': return <Sparkles size={20} className="text-emerald-700" />;
      case 'Layers': return <Layers size={20} className="text-emerald-700" />;
      case 'Sliders': return <Sliders size={20} className="text-emerald-700" />;
      case 'Shield': return <Shield size={20} className="text-emerald-700" />;
      case 'Brain': return <Brain size={20} className="text-emerald-700" />;
      case 'Flame': return <Flame size={20} className="text-emerald-700" />;
      case 'Clock': return <Clock size={20} className="text-emerald-700" />;
      default: return <Leaf size={20} className="text-emerald-700" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
              <Leaf size={22} />
            </span>
            <h2 className="text-2xl font-bold text-slate-900">
              AYUSH & Dashavidha Pariksha Intake
            </h2>
          </div>
          <p className="text-sm text-slate-600 mt-1">
            Ayurvedic holistic health assessment: Body constitution, digestive fire, dietary habits, and disease progression.
          </p>
        </div>
        <AudioPrompt promptText="Please complete the Ayurvedic Dashavidha Pariksha questions below regarding your body constitution and habits." />
      </div>

      {/* Notice Banner: Patient-Reported vs Clinician Verified */}
      <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 flex items-start gap-3 text-xs text-emerald-950">
        <Info size={18} className="text-emerald-700 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold">
            🌿 Patient-Reported Ayurvedic Health Information
          </p>
          <p className="text-emerald-800 leading-relaxed">
            The selections you make here represent your self-reported health habits and bodily tendencies. Your final <strong>Prakriti (Dosha constitution)</strong> and personalized Ayurvedic treatment plan will be clinically verified by the consulting doctor in the OPD.
          </p>
        </div>
      </div>

      {/* Tab Stepper */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer border ${
                isActive
                  ? 'bg-emerald-800 text-white border-emerald-800 shadow-sm'
                  : 'bg-slate-50 text-slate-700 hover:bg-emerald-50 border-slate-200'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 0: Dashavidha Pariksha 1 to 5 */}
      {activeTab === 0 && (
        <div className="space-y-6">
          {DASHAVIDHA_PARIKSHA_FIELDS.slice(0, 5).map((field) => {
            const fieldState = ayushData.dashavidhaPariksha?.[field.id] || {};

            return (
              <div key={field.id} className="bg-slate-50/70 border border-slate-200 rounded-3xl p-5 sm:p-6 space-y-4">
                <div className="flex items-start justify-between gap-3 border-b border-slate-200/80 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-emerald-100 rounded-xl">
                      {renderFieldIcon(field.icon)}
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900">
                        {language === 'hi' ? field.titleHi : field.titleEn}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {language === 'hi' ? field.descHi : field.descEn}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Sub Questions */}
                <div className="space-y-4 pt-1">
                  {field.questions.map((q) => {
                    const currentValue = fieldState[q.key];

                    return (
                      <div key={q.key} className="space-y-2">
                        <label className="block text-xs font-extrabold text-slate-700">
                          {language === 'hi' ? q.labelHi : q.labelEn}
                        </label>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                          {q.options.map((opt) => {
                            const isSelected = q.isMulti 
                              ? (Array.isArray(currentValue) && currentValue.includes(opt.value))
                              : currentValue === opt.value;

                            return (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() => {
                                  if (q.isMulti) {
                                    toggleMultiSymptom(opt.value);
                                  } else {
                                    updateDashavidhaField(field.id, q.key, opt.value);
                                  }
                                }}
                                className={`p-3.5 rounded-2xl text-left border-2 transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                                  isSelected
                                    ? 'bg-emerald-50 border-emerald-600 text-emerald-950 shadow-xs ring-2 ring-emerald-500/20'
                                    : 'bg-white border-slate-200 text-slate-700 hover:border-emerald-300'
                                }`}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <span className="text-xs font-bold leading-snug">
                                    {language === 'hi' ? opt.labelHi : opt.labelEn}
                                  </span>
                                  {isSelected && (
                                    <CheckCircle2 size={16} className="text-emerald-700 flex-shrink-0" />
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 1: Dashavidha Pariksha 6 to 10 */}
      {activeTab === 1 && (
        <div className="space-y-6">
          {DASHAVIDHA_PARIKSHA_FIELDS.slice(5, 10).map((field) => {
            const fieldState = ayushData.dashavidhaPariksha?.[field.id] || {};

            return (
              <div key={field.id} className="bg-slate-50/70 border border-slate-200 rounded-3xl p-5 sm:p-6 space-y-4">
                <div className="flex items-start justify-between gap-3 border-b border-slate-200/80 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-emerald-100 rounded-xl">
                      {renderFieldIcon(field.icon)}
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900">
                        {language === 'hi' ? field.titleHi : field.titleEn}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {language === 'hi' ? field.descHi : field.descEn}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Sub Questions */}
                <div className="space-y-4 pt-1">
                  {field.questions.map((q) => {
                    const currentValue = fieldState[q.key];

                    return (
                      <div key={q.key} className="space-y-2">
                        <label className="block text-xs font-extrabold text-slate-700">
                          {language === 'hi' ? q.labelHi : q.labelEn}
                        </label>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                          {q.options.map((opt) => {
                            const isSelected = currentValue === opt.value;

                            return (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() => updateDashavidhaField(field.id, q.key, opt.value)}
                                className={`p-3.5 rounded-2xl text-left border-2 transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                                  isSelected
                                    ? 'bg-emerald-50 border-emerald-600 text-emerald-950 shadow-xs ring-2 ring-emerald-500/20'
                                    : 'bg-white border-slate-200 text-slate-700 hover:border-emerald-300'
                                }`}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <span className="text-xs font-bold leading-snug">
                                    {language === 'hi' ? opt.labelHi : opt.labelEn}
                                  </span>
                                  {isSelected && (
                                    <CheckCircle2 size={16} className="text-emerald-700 flex-shrink-0" />
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: Agni & Koshtha */}
      {activeTab === 2 && (
        <div className="space-y-6">
          {/* Agni */}
          <div className="bg-slate-50/70 border border-slate-200 rounded-3xl p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-2.5 border-b border-slate-200 pb-3">
              <div className="p-2 bg-amber-100 text-amber-800 rounded-xl">
                <Flame size={20} />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Digestive Fire & Appetite Pattern (Agni)
                </h3>
                <p className="text-xs text-slate-500">
                  How consistent and strong is your digestive fire?
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {ADDITIONAL_AYUSH_SECTIONS[0].options.map((opt) => {
                const isSelected = ayushData.additionalHistory?.agni === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => updateAdditionalHistory('agni', null, opt.value)}
                    className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-50 border-amber-600 text-amber-950 ring-2 ring-amber-500/20 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-amber-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-xs font-bold block">{opt.labelEn}</span>
                        {language === 'hi' && (
                          <span className="text-[11px] text-slate-500 mt-1 block">{opt.labelHi}</span>
                        )}
                      </div>
                      {isSelected && <CheckCircle2 size={16} className="text-amber-700 flex-shrink-0" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Koshtha */}
          <div className="bg-slate-50/70 border border-slate-200 rounded-3xl p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-2.5 border-b border-slate-200 pb-3">
              <div className="p-2 bg-cyan-100 text-cyan-800 rounded-xl">
                <Layers size={20} />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Bowel Movement Nature (Koshtha)
                </h3>
                <p className="text-xs text-slate-500">
                  Natural frequency and firmness of your bowel movements.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {ADDITIONAL_AYUSH_SECTIONS[1].options.map((opt) => {
                const isSelected = ayushData.additionalHistory?.koshtha === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => updateAdditionalHistory('koshtha', null, opt.value)}
                    className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-50 border-cyan-600 text-cyan-950 ring-2 ring-cyan-500/20 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-cyan-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-xs font-bold block">{opt.labelEn}</span>
                        {language === 'hi' && (
                          <span className="text-[11px] text-slate-500 mt-1 block">{opt.labelHi}</span>
                        )}
                      </div>
                      {isSelected && <CheckCircle2 size={16} className="text-cyan-700 flex-shrink-0" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Ahara & Vihara */}
      {activeTab === 3 && (
        <div className="space-y-6">
          {/* Ahara */}
          <div className="bg-slate-50/70 border border-slate-200 rounded-3xl p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-2.5 border-b border-slate-200 pb-3">
              <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
                <Utensils size={20} />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Dietary Habits & Fluid Intake (Ahara)
                </h3>
                <p className="text-xs text-slate-500">
                  Tell the doctor about your routine foods, cravings, and water consumption.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Diet Type</label>
                <select
                  value={ayushData.additionalHistory?.ahara?.dietType || 'Vegetarian with dairy'}
                  onChange={(e) => updateAdditionalHistory('ahara', 'dietType', e.target.value)}
                  className="w-full p-3 bg-white border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500"
                >
                  <option>Vegetarian with dairy (Ghee / Milk)</option>
                  <option>Strict Vegan</option>
                  <option>Non-Vegetarian (Eggs / Meat)</option>
                  <option>Mixed diet</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Daily Water Intake</label>
                <select
                  value={ayushData.additionalHistory?.ahara?.waterIntake || '2 - 3 Litres / day'}
                  onChange={(e) => updateAdditionalHistory('ahara', 'waterIntake', e.target.value)}
                  className="w-full p-3 bg-white border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500"
                >
                  <option>Less than 1.5 Litres / day</option>
                  <option>1.5 - 2.5 Litres / day</option>
                  <option>2.5 - 3.5 Litres / day</option>
                  <option>More than 3.5 Litres / day</option>
                </select>
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-bold text-slate-700">Meal Timings & Unwholesome Habits (Optional)</label>
                <input
                  type="text"
                  value={ayushData.additionalHistory?.ahara?.unwholesomeHabits || ''}
                  onChange={(e) => updateAdditionalHistory('ahara', 'unwholesomeHabits', e.target.value)}
                  placeholder="e.g. Late dinners at 11 PM, eating while watching screens, excess tea/coffee"
                  className="w-full p-3 bg-white border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Vihara */}
          <div className="bg-slate-50/70 border border-slate-200 rounded-3xl p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-2.5 border-b border-slate-200 pb-3">
              <div className="p-2 bg-purple-100 text-purple-800 rounded-xl">
                <Clock size={20} />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Daily Regimen & Physical Routine (Vihara)
                </h3>
                <p className="text-xs text-slate-500">
                  Sleep schedule, physical movement, and stress patterns.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Routine Wake-Up Time</label>
                <input
                  type="text"
                  value={ayushData.additionalHistory?.vihara?.wakeTime || '6:30 AM'}
                  onChange={(e) => updateAdditionalHistory('vihara', 'wakeTime', e.target.value)}
                  className="w-full p-3 bg-white border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Routine Bedtime</label>
                <input
                  type="text"
                  value={ayushData.additionalHistory?.vihara?.sleepTime || '11:00 PM'}
                  onChange={(e) => updateAdditionalHistory('vihara', 'sleepTime', e.target.value)}
                  className="w-full p-3 bg-white border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Daytime Naps (Divaswapna)</label>
                <select
                  value={ayushData.additionalHistory?.vihara?.daytimeNap || 'None'}
                  onChange={(e) => updateAdditionalHistory('vihara', 'daytimeNap', e.target.value)}
                  className="w-full p-3 bg-white border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-purple-500"
                >
                  <option>None / Stays active</option>
                  <option>Brief 15-20 min nap</option>
                  <option>Long sleep (1-2 hours) after lunch</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Daily Stress Level</label>
                <select
                  value={ayushData.additionalHistory?.vihara?.stressLevel || 'Moderate'}
                  onChange={(e) => updateAdditionalHistory('vihara', 'stressLevel', e.target.value)}
                  className="w-full p-3 bg-white border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-purple-500"
                >
                  <option>Low / Calm environment</option>
                  <option>Moderate / Work-related deadlines</option>
                  <option>High / Chronic emotional or mental strain</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Nidana & Samprapti */}
      {activeTab === 4 && (
        <div className="space-y-6">
          {/* Nidana */}
          <div className="bg-slate-50/70 border border-slate-200 rounded-3xl p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-2.5 border-b border-slate-200 pb-3">
              <div className="p-2 bg-red-100 text-red-800 rounded-xl">
                <AlertCircle size={20} />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Causative Factors & Triggers (Nidana)
                </h3>
                <p className="text-xs text-slate-500">
                  What factors (food, cold air, late nights, anxiety, travel) trigger your health concern?
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">
                  Patient-Reported Triggering Factors
                </label>
                <button
                  type="button"
                  onClick={() => setShowNidanaVoice(!showNidanaVoice)}
                  className="px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-lg text-xs font-bold border border-emerald-300 flex items-center gap-1 hover:bg-emerald-100 cursor-pointer"
                >
                  <Mic size={13} />
                  <span>{showNidanaVoice ? 'Close Mic' : 'Voice Dictate'}</span>
                </button>
              </div>

              {showNidanaVoice && (
                <VoiceInputWidget
                  languageKey={language}
                  promptLabel="Speak what triggers your condition (e.g. cold water, spicy food, late sleep)"
                  currentValue={ayushData.additionalHistory?.nidana?.patientReportedTriggers || ''}
                  onTranscriptConfirmed={(text) => {
                    updateAdditionalHistory('nidana', 'patientReportedTriggers', text);
                    setShowNidanaVoice(false);
                  }}
                  onFallbackToText={() => setShowNidanaVoice(false)}
                />
              )}

              <textarea
                rows={3}
                value={ayushData.additionalHistory?.nidana?.patientReportedTriggers || ''}
                onChange={(e) => updateAdditionalHistory('nidana', 'patientReportedTriggers', e.target.value)}
                placeholder="e.g. Eating outside oily food, sleeping after 1 AM, cold water bath, stressful travel"
                className="w-full p-3.5 bg-white border border-slate-300 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Samprapti */}
          <div className="bg-slate-50/70 border border-slate-200 rounded-3xl p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-2.5 border-b border-slate-200 pb-3">
              <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
                <Activity size={20} />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Disease Progression & Relief Factors (Samprapti)
                </h3>
                <p className="text-xs text-slate-500">
                  How the condition progressed and what makes you feel better or worse.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">
                    How did the symptoms begin and change over time?
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowSampraptiVoice(!showSampraptiVoice)}
                    className="px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-lg text-xs font-bold border border-emerald-300 flex items-center gap-1 hover:bg-emerald-100 cursor-pointer"
                  >
                    <Mic size={13} />
                    <span>{showSampraptiVoice ? 'Close Mic' : 'Voice Dictate'}</span>
                  </button>
                </div>

                {showSampraptiVoice && (
                  <VoiceInputWidget
                    languageKey={language}
                    promptLabel="Speak how your illness started and changed over days or months"
                    currentValue={ayushData.additionalHistory?.samprapti?.patientReportedProgression || ''}
                    onTranscriptConfirmed={(text) => {
                      updateAdditionalHistory('samprapti', 'patientReportedProgression', text);
                      setShowSampraptiVoice(false);
                    }}
                    onFallbackToText={() => setShowSampraptiVoice(false)}
                  />
                )}

                <textarea
                  rows={2}
                  value={ayushData.additionalHistory?.samprapti?.patientReportedProgression || ''}
                  onChange={(e) => updateAdditionalHistory('samprapti', 'patientReportedProgression', e.target.value)}
                  placeholder="e.g. Started with mild bloating, then developed into burning acid reflux"
                  className="w-full p-3 bg-white border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Relieving Factors (Upashaya)</label>
                  <input
                    type="text"
                    value={ayushData.additionalHistory?.samprapti?.relievingFactors || ''}
                    onChange={(e) => updateAdditionalHistory('samprapti', 'relievingFactors', e.target.value)}
                    placeholder="e.g. Warm water, resting, light food"
                    className="w-full p-3 bg-white border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Aggravating Factors (Anupashaya)</label>
                  <input
                    type="text"
                    value={ayushData.additionalHistory?.samprapti?.aggravatingFactors || ''}
                    onChange={(e) => updateAdditionalHistory('samprapti', 'aggravatingFactors', e.target.value)}
                    placeholder="e.g. Spicy food, empty stomach, stress"
                    className="w-full p-3 bg-white border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Navigation Controls */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          disabled={activeTab === 0}
          onClick={() => setActiveTab(prev => Math.max(0, prev - 1))}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={16} />
          <span>Previous AYUSH Section</span>
        </button>

        <span className="text-xs font-bold text-emerald-900 bg-emerald-100 px-3 py-1 rounded-full">
          Section {activeTab + 1} of {tabs.length}
        </span>

        <button
          type="button"
          disabled={activeTab === tabs.length - 1}
          onClick={() => setActiveTab(prev => Math.min(tabs.length - 1, prev + 1))}
          className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs flex items-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
        >
          <span>Next AYUSH Section</span>
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};
