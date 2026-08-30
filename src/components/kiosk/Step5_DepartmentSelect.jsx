import React, { useState, useEffect } from 'react';
import { 
  Stethoscope, 
  HeartPulse, 
  Bone, 
  Baby, 
  Sparkles, 
  Search, 
  CheckCircle2, 
  ArrowRight,
  Building2,
  Activity,
  Layers,
  Leaf
} from 'lucide-react';
import { usePatient, standardHospitalDepartments } from '../../context/PatientContext';
import { ApiService } from '../../services/api';
import { AudioPrompt } from '../common/AudioPrompt';

export const Step5_DepartmentSelect = () => {
  const { kioskForm, setKioskForm, hospitals, t } = usePatient();
  const [departments, setDepartments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  const selectedHospId = kioskForm.selectedHospitalId || 'hosp-ggh-hyd';
  const hospital = hospitals.find(h => h.id === selectedHospId) || hospitals[0];

  useEffect(() => {
    const fetchDepartments = async () => {
      setLoading(true);
      try {
        const res = await ApiService.getHospitalDepartments(selectedHospId);
        if (res?.success && Array.isArray(res.departments) && res.departments.length > 0) {
          setDepartments(res.departments);
        } else {
          // Fallback to local structured departments
          setDepartments(standardHospitalDepartments[selectedHospId] || standardHospitalDepartments['hosp-ggh-hyd']);
        }
      } catch {
        setDepartments(standardHospitalDepartments[selectedHospId] || standardHospitalDepartments['hosp-ggh-hyd']);
      } finally {
        setLoading(false);
      }
    };

    fetchDepartments();
  }, [selectedHospId]);

  const filteredDepts = departments.filter(d => 
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (d.description && d.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSelectDepartment = (dept) => {
    const defaultDoctor = dept.name.includes('Cardiology') ? 'Dr. Rajesh Sharma, MD (Cardiology)'
      : dept.name.includes('Ortho') ? 'Dr. Anand Verma, MS (Ortho)'
      : dept.name.includes('Pediatric') ? 'Dr. Priya Nair, MBBS, DNB'
      : 'Assigned OPD Clinician';

    setKioskForm(prev => ({
      ...prev,
      selectedDepartmentId: dept.id,
      selectedDepartmentName: dept.name,
      assignedDepartment: dept.name,
      roomNumber: dept.room_number || 'Room 101',
      assignedDoctor: defaultDoctor
    }));
  };

  const getDeptIcon = (deptName) => {
    const lower = deptName.toLowerCase();
    if (lower.includes('cardio')) return HeartPulse;
    if (lower.includes('ortho')) return Bone;
    if (lower.includes('pediatric') || lower.includes('child')) return Baby;
    if (lower.includes('ayush') || lower.includes('ayurveda')) return Leaf;
    if (lower.includes('surg')) return Activity;
    return Stethoscope;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Layers className="text-cyan-600" />
            <span>{t.selectDepartmentTitle || 'Select Clinical Department / OPD'}</span>
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            {t.selectDepartmentSub || 'Select the relevant medical specialty for your consultation.'}
          </p>
        </div>
        <AudioPrompt promptText="Please choose the outpatient clinical department for your consultation." />
      </div>

      {/* Selected Hospital Context Bar */}
      <div className="p-3.5 bg-slate-100 border border-slate-200 rounded-2xl flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
          <Building2 size={16} className="text-cyan-700" />
          <span>Facility: <strong className="text-slate-900">{hospital?.name}</strong></span>
        </div>
        <span className="text-[11px] font-bold text-slate-500 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
          {departments.length} Available OPD Units
        </span>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={t.searchDepartments || 'Filter departments by symptom or specialty...'}
          className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-2xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all"
        />
      </div>

      {/* Department Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filteredDepts.map((dept) => {
          const isSelected = kioskForm.selectedDepartmentId === dept.id || kioskForm.selectedDepartmentName === dept.name;
          const IconComp = getDeptIcon(dept.name);

          return (
            <button
              key={dept.id || dept.code}
              type="button"
              onClick={() => handleSelectDepartment(dept)}
              style={{
                borderColor: isSelected ? '#088395' : '#e2e8f0',
                backgroundColor: isSelected ? '#f0fdfa' : '#ffffff'
              }}
              className={`p-4 rounded-2xl border-2 text-left transition-all relative flex flex-col justify-between gap-3 group hover:border-cyan-400 hover:shadow-md ${
                isSelected ? 'shadow-md ring-2 ring-cyan-500/20' : ''
              }`}
            >
              <div className="space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <div
                    style={{
                      backgroundColor: isSelected ? '#088395' : '#f1f5f9',
                      color: isSelected ? '#ffffff' : '#088395'
                    }}
                    className="p-2.5 rounded-xl font-bold transition-colors"
                  >
                    <IconComp size={20} />
                  </div>

                  <span className="text-[10px] font-extrabold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200">
                    {dept.room_number || 'Room 101'}
                  </span>
                </div>

                <h4 className="text-sm font-extrabold text-slate-900 group-hover:text-cyan-800 transition-colors pt-1">
                  {dept.name}
                </h4>

                {dept.description && (
                  <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                    {dept.description}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px]">
                <span className="font-mono text-slate-400 font-bold">{dept.code}</span>
                {isSelected ? (
                  <span className="text-cyan-700 font-bold flex items-center gap-1">
                    <CheckCircle2 size={13} /> Selected
                  </span>
                ) : (
                  <span className="text-slate-400 group-hover:text-cyan-700 font-medium">
                    Select OPD →
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
