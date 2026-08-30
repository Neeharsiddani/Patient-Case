import React from 'react';
import { Globe, Volume2, CheckCircle2 } from 'lucide-react';
import { usePatient } from '../../context/PatientContext';
import { languages } from '../../data/translations';
import { AudioPrompt } from '../common/AudioPrompt';

export const Step2_Language = () => {
  const { language, setLanguage, t, speakText } = usePatient();

  const languageDescriptions = {
    en: 'English (Default for Medical Terminologies)',
    hi: 'हिन्दी (उत्तर एवं मध्य भारत हेतु)',
    te: 'తెలుగు (ఆంధ్రప్రదేశ్ మరియు తెలంగాణ)',
    ta: 'தமிழ் (தமிழ்நாடு மற்றும் புதுச்சேரி)',
    mr: 'मराठी (महाराष्ट्र राज्य)',
    bn: 'বাংলা (পশ্চিমবঙ্গ ও ত্রিপুরা)'
  };

  const handleLanguageSelect = (langCode) => {
    setLanguage(langCode);
    const audioPrompts = {
      en: 'You have selected English. MediMitra will assist you in English.',
      hi: 'आपने हिन्दी भाषा का चयन किया है। मेडीमित्र आपका स्वागत करता है।',
      te: 'మీరు తెలుగు భాషను ఎంచుకున్నారు. మెడిమిత్ర మీకు సహాయం చేస్తుంది.',
      ta: 'நீங்கள் தமிழ் மொழியைத் தேர்ந்தெடுத்துள்ளீர்கள். மெடிமித்ரா உங்களை வரவேற்கிறது.',
      mr: 'तुम्ही मराठी भाषा निवडली आहे. मेडीमित्र तुमचे स्वागत करते.',
      bn: 'আপনি বাংলা ভাষা নির্বাচন করেছেন। মেডিমিত্রে আপনাকে স্বাগতম।'
    };
    speakText(audioPrompts[langCode] || 'Language selected', langCode);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Globe className="text-cyan-600" />
            <span>Select Preferred Language / अपनी भाषा चुनें</span>
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Choose your language for touchscreen display and audio voice prompts throughout the consultation.
          </p>
        </div>
        <AudioPrompt promptText="Please select your preferred regional language on the screen." />
      </div>

      {/* Grid of Languages (Large Touch Targets) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {languages.map((lang) => {
          const isSelected = language === lang.code;
          return (
            <button
              key={lang.code}
              type="button"
              onClick={() => handleLanguageSelect(lang.code)}
              style={{
                borderColor: isSelected ? '#088395' : '#e2e8f0',
                backgroundColor: isSelected ? '#ecfeff' : '#ffffff',
                boxShadow: isSelected ? '0 10px 25px -5px rgba(8, 131, 149, 0.2)' : '0 1px 3px 0 rgba(0, 0, 0, 0.05)'
              }}
              className="p-6 rounded-2xl border-2 text-left transition-all duration-200 hover:border-cyan-500 relative flex flex-col justify-between min-h-[140px] group card-hover"
            >
              <div className="flex items-start justify-between">
                <span className="text-3xl">{lang.flag}</span>
                {isSelected ? (
                  <span className="bg-cyan-600 text-white p-1 rounded-full">
                    <CheckCircle2 size={20} />
                  </span>
                ) : (
                  <span className="text-slate-300 group-hover:text-cyan-500 transition-colors">
                    <Volume2 size={20} />
                  </span>
                )}
              </div>

              <div className="mt-3">
                <h3 className="text-xl font-bold text-slate-900 font-indic">
                  {lang.native}
                </h3>
                <p className="text-xs font-semibold text-slate-600 mt-0.5">
                  {lang.name}
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  {languageDescriptions[lang.code]}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      <div className="bg-cyan-50 border border-cyan-200 rounded-xl p-4 flex items-center gap-3 text-cyan-900 text-xs font-medium">
        <Globe size={18} className="text-cyan-700 flex-shrink-0" />
        <span>
          Current Selection: <strong>{languages.find(l => l.code === language)?.name} ({languages.find(l => l.code === language)?.native})</strong>. All clinical questions will adapt automatically.
        </span>
      </div>
    </div>
  );
};
