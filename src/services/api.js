/**
 * MediMitra API Client & Network Service Layer
 * 
 * Provides authenticated HTTP communication with the MediMitra clinical backend.
 * Implements graceful offline fallbacks and healthcare role-based access control.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export class ApiService {
  static getAuthToken() {
    return localStorage.getItem('medimitra_auth_token') || null;
  }

  static setAuthToken(token) {
    if (token) {
      localStorage.setItem('medimitra_auth_token', token);
    } else {
      localStorage.removeItem('medimitra_auth_token');
    }
  }

  static logout() {
    localStorage.removeItem('medimitra_auth_token');
    localStorage.removeItem('medimitra_auth_user');
  }

  static async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = this.getAuthToken();

    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message || data?.error || `HTTP Error ${response.status}`);
      }

      return data;
    } catch (err) {
      console.warn(`[MediMitra API] Network request to ${endpoint} failed:`, err.message);
      throw err;
    }
  }

  // System Health Check
  static async checkHealth() {
    try {
      return await this.request('/health');
    } catch {
      return { status: 'OFFLINE', database: 'DISCONNECTED' };
    }
  }

  // Staff & Doctor Authentication
  static async login(username, password) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
    if (data.token) {
      this.setAuthToken(data.token);
      if (data.user) {
        localStorage.setItem('medimitra_auth_user', JSON.stringify(data.user));
      }
    }
    return data;
  }

  static async quickDoctorAuth(username = 'dr.sharma') {
    try {
      const data = await this.request('/auth/quick-doctor-auth', {
        method: 'POST',
        body: JSON.stringify({ username })
      });
      if (data.token) {
        this.setAuthToken(data.token);
        if (data.user) {
          localStorage.setItem('medimitra_auth_user', JSON.stringify(data.user));
        }
      }
      return data;
    } catch {
      return null;
    }
  }

  static async getMe() {
    return await this.request('/auth/me');
  }

  // Hospital & Facility Management (ABDM HFR Architecture)
  static async getHospitals(filters = {}) {
    const params = new URLSearchParams();
    
    // Support legacy (search, city) or new { search, state, city, district, facility_type, page, limit }
    if (typeof filters === 'string') {
      if (filters) params.append('search', filters);
    } else if (filters && typeof filters === 'object') {
      if (filters.search) params.append('search', filters.search);
      if (filters.state && filters.state !== 'All States' && filters.state !== 'ALL') params.append('state', filters.state);
      if (filters.city && filters.city !== 'ALL') params.append('city', filters.city);
      if (filters.district) params.append('district', filters.district);
      if (filters.facility_type && filters.facility_type !== 'All Types' && filters.facility_type !== 'ALL') params.append('facility_type', filters.facility_type);
      if (filters.lat != null) params.append('lat', filters.lat);
      if (filters.lng != null) params.append('lng', filters.lng);
      if (filters.radius != null) params.append('radius', filters.radius);
      if (filters.sortBy) params.append('sortBy', filters.sortBy);
      if (filters.page) params.append('page', filters.page);
      if (filters.limit) params.append('limit', filters.limit);
    }

    const qs = params.toString() ? `?${params.toString()}` : '';
    return await this.request(`/hospitals${qs}`);
  }

  static async getHospitalById(id) {
    return await this.request(`/hospitals/${id}`);
  }

  static async getHospitalDepartments(hospitalId) {
    return await this.request(`/hospitals/${hospitalId}/departments`);
  }

  static async getHospitalDoctors(hospitalId) {
    return await this.request(`/hospitals/${hospitalId}/doctors`);
  }

  static async getHospitalStats(hospitalId) {
    return await this.request(`/hospitals/${hospitalId}/stats`);
  }

  static async assignDoctorToCase(hospitalId, patientId, doctorId) {
    return await this.request(`/hospitals/${hospitalId}/assign-doctor`, {
      method: 'POST',
      body: JSON.stringify({ patientId, doctorId })
    });
  }

  static async createDepartment(hospitalId, deptData) {
    return await this.request(`/hospitals/${hospitalId}/departments`, {
      method: 'POST',
      body: JSON.stringify(deptData)
    });
  }

  static async registerDoctor(hospitalId, doctorData) {
    return await this.request(`/hospitals/${hospitalId}/doctors`, {
      method: 'POST',
      body: JSON.stringify(doctorData)
    });
  }

  // Patient Case Management (Hospital & Department Scoped)
  static async getPatients(filters = {}) {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.triage) params.append('triage', filters.triage);
    if (filters.search) params.append('search', filters.search);
    if (filters.hospitalId) params.append('hospitalId', filters.hospitalId);
    if (filters.departmentId) params.append('departmentId', filters.departmentId);
    if (filters.myAssignedOnly) params.append('myAssignedOnly', 'true');

    const queryString = params.toString() ? `?${params.toString()}` : '';
    return await this.request(`/patients${queryString}`);
  }

  static async getPatientById(id) {
    return await this.request(`/patients/${id}`);
  }

  static async submitPatientIntake(intakeData) {
    return await this.request('/patients/intake', {
      method: 'POST',
      body: JSON.stringify(intakeData)
    });
  }

  // Doctor Actions
  static async confirmSummary(patientId, doctorNotes, editedFields) {
    return await this.request('/doctor/confirm-summary', {
      method: 'POST',
      body: JSON.stringify({ patientId, doctorNotes, editedFields })
    });
  }

  static async rejectSummary(patientId, reason) {
    return await this.request('/doctor/reject-summary', {
      method: 'POST',
      body: JSON.stringify({ patientId, reason })
    });
  }

  static async ePrescribe(prescriptionData) {
    return await this.request('/doctor/eprescribe', {
      method: 'POST',
      body: JSON.stringify(prescriptionData)
    });
  }

  // Document Upload & OCR
  static async uploadDocument(file, patientId, docTypeHint) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('patientId', patientId || 'temp-patient');
    formData.append('docTypeHint', docTypeHint || 'prescription');

    const token = this.getAuthToken();
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    const response = await fetch(`${API_BASE_URL}/documents/upload`, {
      method: 'POST',
      headers,
      body: formData
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.message || 'Document upload failed');
    }
    return data;
  }

  // ABDM FHIR R4 Bundle Export
  static async exportFhirBundle(patientId) {
    return await this.request(`/fhir/patient/${patientId}`);
  }
}
