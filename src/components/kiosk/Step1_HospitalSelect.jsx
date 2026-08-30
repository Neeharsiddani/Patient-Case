import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Building2, 
  Search, 
  MapPin, 
  Phone, 
  ShieldCheck, 
  CheckCircle2, 
  Hospital, 
  ArrowRight,
  Filter,
  Navigation,
  ChevronLeft,
  ChevronRight,
  Layers,
  Sparkles,
  Loader2,
  X,
  Compass,
  Zap,
  Clock,
  Radio,
  LocateFixed,
  Map
} from 'lucide-react';
import { usePatient } from '../../context/PatientContext';
import { ApiService } from '../../services/api';
import { AudioPrompt } from '../common/AudioPrompt';
import { 
  POPULAR_LOCALITIES, 
  identifyNearestLocality, 
  resolveLocalityCoordinates 
} from '../../utils/localityDirectory';

// Quick Featured Neighborhoods for Instant 1-Click Proximity
const FEATURED_LOCALITIES = [
  { name: 'Balapur', label: '📍 Balapur', lat: 17.3090, lng: 78.5080, state: 'Telangana' },
  { name: 'Chandrayangutta / Barkas', label: '📍 Chandrayangutta', lat: 17.3240, lng: 78.4820, state: 'Telangana' },
  { name: 'Santosh Nagar / Kanchanbagh', label: '📍 Santosh Nagar', lat: 17.3490, lng: 78.5120, state: 'Telangana' },
  { name: 'Malakpet / Dilsukhnagar', label: '📍 Malakpet', lat: 17.3735, lng: 78.5045, state: 'Telangana' },
  { name: 'LB Nagar / Vanasthalipuram', label: '📍 LB Nagar', lat: 17.3580, lng: 78.5520, state: 'Telangana' },
  { name: 'Gachibowli / Hitech City', label: '📍 Gachibowli', lat: 17.4401, lng: 78.3489, state: 'Telangana' },
  { name: 'Kukatpally / KPHB', label: '📍 Kukatpally', lat: 17.4875, lng: 78.4012, state: 'Telangana' },
  { name: 'Banjara Hills / Somajiguda', label: '📍 Banjara Hills', lat: 17.4165, lng: 78.4485, state: 'Telangana' },
  { name: 'Secunderabad / Begumpet', label: '📍 Secunderabad', lat: 17.4410, lng: 78.4980, state: 'Telangana' },
  { name: 'Shamshabad', label: '📍 Shamshabad', lat: 17.2540, lng: 78.4280, state: 'Telangana' },
  { name: 'Delhi NCR', label: '📍 Delhi NCR', lat: 28.6139, lng: 77.2090, state: 'Delhi' },
  { name: 'Mumbai City', label: '📍 Mumbai', lat: 19.0033, lng: 72.8427, state: 'Maharashtra' },
  { name: 'Bengaluru', label: '📍 Bengaluru', lat: 12.9619, lng: 77.5750, state: 'Karnataka' }
];

export const Step1_HospitalSelect = () => {
  const { kioskForm, setKioskForm, t } = usePatient();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedState, setSelectedState] = useState('All States');
  const [selectedType, setSelectedType] = useState('All Types');
  const [selectedRadius, setSelectedRadius] = useState('ALL'); // 'ALL', '5', '10', '25', '50'
  const [pageSize, setPageSize] = useState('16'); // '16', '32', 'all'
  const [patientCoords, setPatientCoords] = useState(null); // Explicit user choice
  const [activeAreaName, setActiveAreaName] = useState('All Regions');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locationNotice, setLocationNotice] = useState(null);
  const [showAreaDropdown, setShowAreaDropdown] = useState(false);

  const [hospitalsData, setHospitalsData] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1, page: 1, limit: 16 });
  const [availableStates, setAvailableStates] = useState(['All States']);
  const [availableTypes, setAvailableTypes] = useState(['All Types']);

  // Fetch paginated & filtered hospital directory from centralized API with proximity calculation
  const fetchHospitals = useCallback(async (querySearch, queryState, queryType, queryRadius, coords, queryPage, queryLimit) => {
    setLoading(true);
    try {
      const res = await ApiService.getHospitals({
        search: querySearch,
        state: queryState === 'All States' ? '' : queryState,
        facility_type: queryType === 'All Types' ? '' : queryType,
        radius: queryRadius === 'ALL' ? '' : queryRadius,
        lat: coords?.lat,
        lng: coords?.lng,
        sortBy: coords ? 'proximity' : 'name',
        page: queryPage,
        limit: queryLimit === 'all' ? 200 : parseInt(queryLimit, 10) || 16
      });

      if (res?.success) {
        setHospitalsData(res.hospitals || []);
        setPagination({
          total: res.total || 0,
          totalPages: res.totalPages || 1,
          page: res.page || 1,
          limit: res.limit || 16
        });

        if (res.filters?.states) setAvailableStates(res.filters.states);
        if (res.filters?.facilityTypes) setAvailableTypes(res.filters.facilityTypes);
      }
    } catch (err) {
      console.warn('Centralized hospital directory fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced search & filter trigger
  useEffect(() => {
    const handler = setTimeout(() => {
      setPage(1);

      // Check if user search matches a known locality name
      let effectiveCoords = patientCoords;
      if (searchTerm && !patientCoords) {
        const resolved = resolveLocalityCoordinates(searchTerm);
        if (resolved) {
          effectiveCoords = { lat: resolved.lat, lng: resolved.lng };
          setActiveAreaName(resolved.name);
        }
      }

      fetchHospitals(searchTerm, selectedState, selectedType, selectedRadius, effectiveCoords, 1, pageSize);
    }, 300);

    return () => clearTimeout(handler);
  }, [searchTerm, selectedState, selectedType, selectedRadius, patientCoords, pageSize, fetchHospitals]);

  // Page change trigger
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPage(newPage);
      fetchHospitals(searchTerm, selectedState, selectedType, selectedRadius, patientCoords, newPage, pageSize);
      window.scrollTo({ top: 120, behavior: 'smooth' });
    }
  };

  const handleSelectHospital = (hosp) => {
    setKioskForm(prev => ({
      ...prev,
      selectedHospitalId: hosp.id,
      selectedHospitalName: hosp.name,
      hospital_id: hosp.id,
      hospital_name: hosp.name,
      assignedDepartment: hosp.departments?.[0]?.name || 'General Medicine',
      department_id: hosp.departments?.[0]?.id || `dept-${hosp.id}-genmed`
    }));
  };

  // Switch locality / neighborhood directly
  const handleSelectLocality = (loc) => {
    setActiveAreaName(loc.name);
    setSelectedState(loc.state || 'All States');
    setSearchTerm('');
    setPatientCoords({ lat: loc.lat, lng: loc.lng });
    setLocationNotice(`📍 Location set to ${loc.name} (${loc.district || loc.state}). Showing all nearby hospitals sorted by distance.`);
    setShowAreaDropdown(false);
    setTimeout(() => setLocationNotice(null), 5000);
  };

  // Real-time Browser Geolocation (GPS) with Instant Locality Identification
  const handleAutoDetectGPS = () => {
    if (!navigator.geolocation) {
      setLocationNotice('Location services are not supported on this browser/device.');
      return;
    }

    setLocating(true);
    setLocationNotice(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        const { latitude, longitude } = pos.coords;
        setPatientCoords({ lat: latitude, lng: longitude });

        // Identify nearest neighborhood / locality
        const matchedArea = identifyNearestLocality(latitude, longitude);
        const areaLabel = matchedArea ? `${matchedArea.name} (${matchedArea.group || matchedArea.district})` : 'Current GPS Location';
        
        setActiveAreaName(areaLabel);
        setSelectedState('All States');
        setSearchTerm('');
        setLocationNotice(`📍 Auto-Detected: You are at ${areaLabel} [${latitude.toFixed(3)}°N, ${longitude.toFixed(3)}°E] - All local healthcare facilities are now sorted by distance!`);
        setTimeout(() => setLocationNotice(null), 6000);
      },
      (err) => {
        setLocating(false);
        // Fallback to Balapur / South Hyderabad default if GPS is disabled
        setPatientCoords({ lat: 17.3090, lng: 78.5080 });
        setActiveAreaName('Balapur / South Hyderabad');
        setLocationNotice('GPS permission prompt was dismissed. Showing all facilities near Balapur / South Hyderabad.');
        setTimeout(() => setLocationNotice(null), 5000);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedState('All States');
    setSelectedType('All Types');
    setSelectedRadius('ALL');
    setActiveAreaName('All Regions');
    setPatientCoords(null);
    setPageSize('16');
    setPage(1);
    setShowAreaDropdown(false);
  };

  const currentHospital = hospitalsData.find(h => h.id === kioskForm.selectedHospitalId) || 
    (kioskForm.selectedHospitalId ? { id: kioskForm.selectedHospitalId, name: kioskForm.selectedHospitalName } : null);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 font-heading flex items-center gap-2">
            <Building2 className="text-cyan-700" />
            <span>Select Healthcare Facility</span>
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Auto-detect your current area (e.g. Balapur, Gachibowli, Kukatpally, Santosh Nagar) or select any neighborhood across India.
          </p>
        </div>
        <AudioPrompt promptText="Please search and select your healthcare facility from the directory below." />
      </div>

      {/* Patient Proximity Bar: Auto-Detect GPS & Area Selector */}
      <div className="bg-slate-50 border border-slate-200 rounded-3xl p-4 sm:p-5 space-y-3.5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-cyan-100 text-cyan-800 rounded-xl">
              <LocateFixed size={20} />
            </div>
            <div>
              <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block">
                Active Location:
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs font-bold text-cyan-950 bg-cyan-100/90 px-3 py-1 rounded-full border border-cyan-300 shadow-xs">
                  {activeAreaName}
                </span>
                {patientCoords && (
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    🟢 Proximity Distance Active
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Primary Auto-Detect GPS Button */}
            <button
              type="button"
              onClick={handleAutoDetectGPS}
              disabled={locating}
              className="px-4 py-2.5 bg-gradient-to-r from-cyan-700 to-cyan-800 hover:from-cyan-800 hover:to-cyan-900 text-white font-bold rounded-2xl text-xs flex items-center gap-2 transition-all shadow-sm cursor-pointer hover:shadow-md active:scale-98"
            >
              {locating ? <Loader2 size={16} className="animate-spin" /> : <Navigation size={16} />}
              <span>{locating ? 'Detecting Area...' : '📍 Auto-Detect Hospitals Near Me'}</span>
            </button>
          </div>
        </div>

        {/* Quick Locality Chips (Balapur, Chandrayangutta, Santosh Nagar, Malakpet, LB Nagar, Gachibowli, Kukatpally...) */}
        <div className="space-y-2 pt-2 border-t border-slate-200/70">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500">
              Or pick an area / neighborhood:
            </span>
            {activeAreaName !== 'All Regions' && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="text-xs font-bold text-red-600 hover:underline cursor-pointer"
              >
                Reset to All Regions
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1.5 max-h-24 overflow-y-auto pr-1">
            {FEATURED_LOCALITIES.map((loc) => {
              const isActive = activeAreaName.includes(loc.name);
              return (
                <button
                  key={loc.name}
                  type="button"
                  onClick={() => handleSelectLocality(loc)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                    isActive
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs ring-2 ring-cyan-500/30'
                      : 'bg-white text-slate-700 hover:bg-cyan-50 hover:border-cyan-300 border-slate-300'
                  }`}
                >
                  {loc.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Currently Selected Banner / Prompt */}
      {currentHospital ? (
        <div className="p-5 bg-cyan-50 border-2 border-cyan-400 rounded-3xl flex flex-wrap items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-cyan-700 text-white rounded-2xl shadow-sm">
              <Hospital size={24} />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-cyan-900 bg-cyan-100 px-2.5 py-0.5 rounded-full border border-cyan-300">
                Selected Healthcare Facility
              </span>
              <h3 className="text-lg font-extrabold text-slate-900 mt-1">
                {currentHospital.name}
              </h3>
              {currentHospital.city && (
                <p className="text-xs text-slate-600 flex items-center gap-1 mt-0.5 font-medium">
                  <MapPin size={12} className="text-cyan-700" />
                  <span>{currentHospital.location || currentHospital.address || currentHospital.city}, {currentHospital.city}, {currentHospital.state} {currentHospital.pincode ? `• PIN ${currentHospital.pincode}` : ''}</span>
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold bg-white text-slate-700 px-3 py-1.5 rounded-xl border border-cyan-200 shadow-xs">
              ID: {currentHospital.id}
            </span>
          </div>
        </div>
      ) : (
        <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-2xl flex items-center gap-3 text-amber-900 text-xs font-semibold">
          <Building2 size={20} className="text-amber-700 flex-shrink-0" />
          <span>
            <strong>No facility selected yet.</strong> Please click <strong>"Select Facility"</strong> on any hospital or health center below to continue with your intake.
          </span>
        </div>
      )}

      {/* Search, Filter & Radius Controls Bar */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-2.5">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search area (e.g. Balapur, Kukatpally, Gachibowli), hospital name, or PIN code..."
              className="w-full pl-10 pr-4 py-3 bg-white border border-slate-300 rounded-2xl text-sm font-semibold focus:border-cyan-600 focus:ring-2 focus:ring-cyan-500/20 outline-none shadow-xs"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {locationNotice && (
          <div className="text-xs font-semibold text-cyan-900 bg-cyan-50 border border-cyan-300 p-3.5 rounded-2xl flex items-center justify-between shadow-xs">
            <span>{locationNotice}</span>
            <button onClick={() => setLocationNotice(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
              <X size={14} />
            </button>
          </div>
        )}

        {/* Filter Controls Row: States, Facility Types, Radius & View All */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex flex-wrap items-center gap-2">
            {/* State Filter Dropdown */}
            <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-xl px-3 py-1.5 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500">State:</span>
              <select
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                className="text-xs font-bold text-slate-800 bg-transparent outline-none cursor-pointer"
              >
                {availableStates.map((st) => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>

            {/* Facility Type Filter Dropdown */}
            <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-xl px-3 py-1.5 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500">Type:</span>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="text-xs font-bold text-slate-800 bg-transparent outline-none cursor-pointer max-w-[170px]"
              >
                {availableTypes.map((tp) => (
                  <option key={tp} value={tp}>{tp}</option>
                ))}
              </select>
            </div>

            {/* Proximity Radius Filter */}
            {patientCoords && (
              <div className="flex items-center gap-1.5 bg-white border border-emerald-300 rounded-xl px-3 py-1.5 shadow-xs">
                <span className="text-[11px] font-bold text-emerald-800">Radius:</span>
                <select
                  value={selectedRadius}
                  onChange={(e) => setSelectedRadius(e.target.value)}
                  className="text-xs font-bold text-emerald-900 bg-transparent outline-none cursor-pointer"
                >
                  <option value="ALL">All Distances</option>
                  <option value="5">Within 5 km</option>
                  <option value="10">Within 10 km</option>
                  <option value="25">Within 25 km</option>
                  <option value="50">Within 50 km</option>
                </select>
              </div>
            )}

            {/* Show All Toggle */}
            <button
              type="button"
              onClick={() => setPageSize(prev => prev === 'all' ? '16' : 'all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                pageSize === 'all'
                  ? 'bg-cyan-700 text-white border-cyan-700 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              {pageSize === 'all' ? 'Showing All at Once ✓' : 'Show All Facilities'}
            </button>

            {(searchTerm || selectedState !== 'All States' || selectedType !== 'All Types' || selectedRadius !== 'ALL') && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="text-xs font-bold text-red-600 hover:underline px-2 py-1 cursor-pointer"
              >
                Reset Filters
              </button>
            )}
          </div>

          <div className="text-xs font-bold text-slate-500">
            Showing <strong className="text-slate-900">{hospitalsData.length}</strong> of <strong className="text-slate-900">{pagination.total}</strong> healthcare facilities
          </div>
        </div>
      </div>

      {/* Hospital Cards Grid with Loading State */}
      {loading ? (
        <div className="p-16 text-center space-y-3 bg-slate-50 rounded-3xl border border-slate-200">
          <Loader2 size={32} className="animate-spin text-cyan-700 mx-auto" />
          <p className="text-xs font-bold text-slate-600">Calculating distances and loading facilities for {activeAreaName}...</p>
        </div>
      ) : hospitalsData.length === 0 ? (
        <div className="p-12 text-center space-y-3 bg-slate-50 rounded-3xl border border-slate-200">
          <Building2 size={40} className="text-slate-300 mx-auto" />
          <h3 className="text-base font-extrabold text-slate-800">No healthcare facilities found</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            No matching facilities found for "{searchTerm || activeAreaName}". Try broadening your search radius or clicking "Show All Facilities".
          </p>
          <button
            type="button"
            onClick={handleClearFilters}
            className="mt-2 px-4 py-2 bg-slate-900 text-white rounded-xl font-bold text-xs hover:bg-slate-800 cursor-pointer"
          >
            Show All Facilities
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {hospitalsData.map((hosp) => {
            const isSelected = kioskForm.selectedHospitalId === hosp.id;

            return (
              <div
                key={hosp.id}
                style={{
                  borderColor: isSelected ? '#088395' : '#e2e8f0',
                  backgroundColor: isSelected ? '#f0fdfa' : '#ffffff'
                }}
                className={`p-5 rounded-3xl border-2 transition-all flex flex-col justify-between gap-4 group hover:border-cyan-400 hover:shadow-md ${
                  isSelected ? 'shadow-md ring-2 ring-cyan-500/20' : ''
                }`}
              >
                <div className="space-y-2.5">
                  {/* Top Badges & Hospital Title */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-cyan-800 bg-cyan-50 px-2.5 py-0.5 rounded-md border border-cyan-200">
                          {hosp.facility_type || 'Healthcare Facility'}
                        </span>
                        {hosp.distance_km != null && (
                          <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-md border flex items-center gap-1 ${
                            hosp.distance_km <= 5 
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-black' 
                              : hosp.distance_km <= 15 
                              ? 'bg-teal-50 text-teal-800 border-teal-200' 
                              : hosp.distance_km <= 35 
                              ? 'bg-amber-50 text-amber-800 border-amber-200' 
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}>
                            <Navigation size={10} className="text-emerald-700" />
                            <span>{hosp.distance_km} km from {activeAreaName.split(' ')[0]}</span>
                          </span>
                        )}
                      </div>

                      <h3 className="text-base font-extrabold text-slate-900 group-hover:text-cyan-900 transition-colors leading-tight">
                        {hosp.name}
                      </h3>
                    </div>

                    {isSelected && (
                      <span className="w-7 h-7 bg-cyan-700 text-white rounded-full flex items-center justify-center shadow-sm flex-shrink-0">
                        <CheckCircle2 size={18} />
                      </span>
                    )}
                  </div>

                  {/* Location & Address */}
                  <p className="text-xs text-slate-600 flex items-start gap-1.5 leading-relaxed font-medium">
                    <MapPin size={14} className="text-slate-400 flex-shrink-0 mt-0.5" />
                    <span>
                      {hosp.location || hosp.address}, {hosp.city}, {hosp.state} {hosp.pincode ? `• PIN ${hosp.pincode}` : ''}
                    </span>
                  </p>

                  {/* Available Clinical OPDs Preview */}
                  {hosp.departments && hosp.departments.length > 0 && (
                    <div className="space-y-1 pt-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Available Clinical OPDs ({hosp.departments.length}):
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {hosp.departments.slice(0, 4).map((d, idx) => (
                          <span key={idx} className="bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded text-[10px] border border-slate-200">
                            {d.name}
                          </span>
                        ))}
                        {hosp.departments.length > 4 && (
                          <span className="bg-slate-50 text-slate-500 font-bold px-1.5 py-0.5 rounded text-[10px]">
                            +{hosp.departments.length - 4} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom Action Row */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="text-[11px] font-mono text-slate-400">
                    Code: <strong className="text-slate-700">{hosp.code}</strong>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSelectHospital(hosp)}
                    style={{
                      backgroundColor: isSelected ? '#088395' : '#0f2b48',
                      color: '#ffffff'
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-bold transition-colors shadow-xs flex items-center gap-1 cursor-pointer hover:opacity-90"
                  >
                    <span>{isSelected ? 'Selected ✓' : 'Select Facility'}</span>
                    {!isSelected && <ArrowRight size={14} />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Controls (Only when not showing All) */}
      {pageSize !== 'all' && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-600 font-semibold">
            Page <strong className="text-slate-900">{pagination.page}</strong> of <strong className="text-slate-900">{pagination.totalPages}</strong> ({pagination.total} facilities)
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="p-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-30 rounded-xl text-slate-700 font-bold text-xs transition-colors flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed"
            >
              <ChevronLeft size={16} />
              <span>Previous</span>
            </button>

            <button
              type="button"
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="p-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-30 rounded-xl text-slate-700 font-bold text-xs transition-colors flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed"
            >
              <span>Next</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
