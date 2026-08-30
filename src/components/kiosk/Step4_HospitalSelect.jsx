import React, { useState } from 'react';
import { 
  Building2, 
  Search, 
  MapPin, 
  Phone, 
  ShieldCheck, 
  CheckCircle2, 
  Hospital, 
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { usePatient } from '../../context/PatientContext';
import { AudioPrompt } from '../common/AudioPrompt';

export const Step4_HospitalSelect = () => {
  const { hospitals, kioskForm, setKioskForm, setKioskStep, t } = usePatient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState('all');

  const cities = ['all', ...new Set(hospitals.map(h => h.city))];

  const filteredHospitals = hospitals.filter(h => {
    const matchesSearch = 
      h.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.city.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCity = selectedCity === 'all' || h.city === selectedCity;
    return matchesSearch && matchesCity;
  });

  const handleSelectHospital = (hosp) => {
    setKioskForm(prev => ({
      ...prev,
      selectedHospitalId: hosp.id,
      selectedHospitalName: hosp.name
    }));
  };

  const currentHospital = hospitals.find(h => h.id === kioskForm.selectedHospitalId) || hospitals[0];

  return (
    <div className="space-y-6">
      {/* Step Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="text-cyan-600" />
            <span>{t.selectHospitalTitle || 'Select Healthcare Facility'}</span>
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            {t.selectHospitalSub || 'Choose the hospital or healthcare centre where you want to consult today.'}
          </p>
        </div>
        <AudioPrompt promptText="Please select your preferred healthcare facility or hospital from the list below." />
      </div>

      {/* Search & City Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t.searchHospitals || 'Search hospitals by name, city, or area...'}
            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-2xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {cities.map((city) => (
            <button
              key={city}
              type="button"
              onClick={() => setSelectedCity(city)}
              style={{
                backgroundColor: selectedCity === city ? '#088395' : '#f1f5f9',
                color: selectedCity === city ? '#ffffff' : '#475569'
              }}
              className="px-3.5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors"
            >
              {city === 'all' ? 'All Locations' : `📍 ${city}`}
            </button>
          ))}
        </div>
      </div>

      {/* Currently Selected Banner */}
      {currentHospital && (
        <div className="p-4 bg-cyan-50 border-2 border-cyan-300 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-cyan-700 text-white rounded-xl">
              <Hospital size={22} />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-cyan-800 bg-cyan-100 px-2 py-0.5 rounded-md">
                Selected Facility
              </span>
              <h3 className="text-base font-extrabold text-slate-900 mt-0.5">
                {currentHospital.name}
              </h3>
              <p className="text-xs text-slate-600 flex items-center gap-1">
                <MapPin size={12} className="text-cyan-700" />
                <span>{currentHospital.location}, {currentHospital.city}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-cyan-900 bg-white border border-cyan-200 px-3 py-1.5 rounded-xl shadow-xs">
              Code: {currentHospital.code}
            </span>
          </div>
        </div>
      )}

      {/* Hospital Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredHospitals.map((hosp) => {
          const isSelected = kioskForm.selectedHospitalId === hosp.id;

          return (
            <button
              key={hosp.id}
              type="button"
              onClick={() => handleSelectHospital(hosp)}
              style={{
                borderColor: isSelected ? '#088395' : '#e2e8f0',
                backgroundColor: isSelected ? '#f0fdfa' : '#ffffff'
              }}
              className={`p-5 rounded-3xl border-2 text-left transition-all relative flex flex-col justify-between gap-4 group hover:border-cyan-400 hover:shadow-md ${
                isSelected ? 'shadow-md ring-2 ring-cyan-500/20' : ''
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      style={{
                        backgroundColor: isSelected ? '#088395' : '#f1f5f9',
                        color: isSelected ? '#ffffff' : '#088395'
                      }}
                      className="p-3 rounded-2xl font-bold transition-colors"
                    >
                      <Building2 size={20} />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                        {hosp.facility_type || 'Healthcare Facility'}
                      </span>
                      <h4 className="text-base font-extrabold text-slate-900 group-hover:text-cyan-800 transition-colors">
                        {hosp.name}
                      </h4>
                    </div>
                  </div>

                  {isSelected && (
                    <span className="w-7 h-7 bg-cyan-700 text-white rounded-full flex items-center justify-center shadow-sm">
                      <CheckCircle2 size={18} />
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-600 flex items-start gap-1.5 pt-1">
                  <MapPin size={14} className="text-slate-400 flex-shrink-0 mt-0.5" />
                  <span>{hosp.location}, {hosp.city}, {hosp.state}</span>
                </p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-500">
                <div className="flex items-center gap-1 font-medium">
                  <Phone size={12} className="text-slate-400" />
                  <span>{hosp.phone}</span>
                </div>

                <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                  HFR ID: {hosp.hfr_id || hosp.code}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {filteredHospitals.length === 0 && (
        <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-3xl space-y-2">
          <Building2 size={36} className="mx-auto text-slate-300" />
          <h4 className="text-sm font-bold text-slate-700">No healthcare facility found</h4>
          <p className="text-xs text-slate-400">Try adjusting your search keywords or location filter.</p>
        </div>
      )}
    </div>
  );
};
