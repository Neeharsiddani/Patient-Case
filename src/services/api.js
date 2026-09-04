/**
 * MediMitra API Client & Network Service Layer
 * 
 * Provides authenticated HTTP communication with the MediMitra clinical backend.
 * Uses environment-driven configuration for standalone Express API hosting,
 * with strict zero-mock fail-closed guarantees across all mobile and desktop devices.
 */

import { HospitalDirectoryEngine } from './hospitalDirectoryEngine.js';

/**
 * Resolves the API Base URL in an environment-driven manner:
 * 1. Explicit environment variable (VITE_API_BASE_URL or VITE_API_URL).
 * 2. Static host detection: If deployed to GitHub Pages (*.github.io) without VITE_API_BASE_URL,
 *    returns null to indicate that the separate Express backend URL is required.
 * 3. Same-origin '/api' path (for local Vite dev proxy, or custom reverse proxy to standalone backend).
 */
export const getApiBaseUrl = () => {
  // 1. Explicit environment configuration
  const envUrl = 
    (typeof import.meta !== 'undefined' && import.meta.env && (import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL)) ||
    (typeof process !== 'undefined' && process.env && (process.env.VITE_API_BASE_URL || process.env.VITE_API_URL));

  if (envUrl && typeof envUrl === 'string' && envUrl.trim()) {
    return envUrl.trim().replace(/\/+$/, '');
  }

  // 2. Client-side static host check
  if (typeof window !== 'undefined' && window.location) {
    const hostname = window.location.hostname || '';
    // GitHub Pages static hosting detection (e.g. *.github.io)
    if (hostname.endsWith('github.io')) {
      return null;
    }
  }

  // 3. Same-origin /api path (local Vite dev proxy or custom reverse proxy)
  return '/api';
};

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

  static clearAuthToken() {
    this.logout();
  }

  static async request(endpoint, options = {}) {
    const baseUrl = getApiBaseUrl();
    if (baseUrl === null) {
      throw new Error('Backend API is not configured for this static deployment. Please set VITE_API_BASE_URL in your deployment settings.');
    }

    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `${baseUrl}${cleanEndpoint}`;
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
        if (response.status === 401) {
          this.logout();
        }
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
    return await this.request('/health');
  }

  // Staff & Doctor Authentication
  static async login(username, password) {
    if (!username || !password) {
      throw new Error('Username and password are required.');
    }
    try {
      const data = await this.request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username: username.trim(), password })
      });
      if (data?.token) {
        this.setAuthToken(data.token);
        if (data.user) {
          localStorage.setItem('medimitra_auth_user', JSON.stringify(data.user));
        }
      }
      return data;
    } catch (err) {
      if (err.message && (err.message.includes('Failed to fetch') || err.message.includes('NetworkError') || err.name === 'TypeError')) {
        throw new Error('Unable to connect to the authentication server. Please try again.');
      }
      throw err;
    }
  }

  static async getMe() {
    try {
      return await this.request('/auth/me');
    } catch {
      this.clearAuthToken();
      return { success: false, user: null };
    }
  }

  // Hospital & Facility Management (ABDM HFR Architecture)
  static async getHospitals(filters = {}) {
    const params = new URLSearchParams();
    
    let normalizedFilters = filters;
    if (typeof filters === 'string') {
      normalizedFilters = { search: filters };
    }

    if (normalizedFilters && typeof normalizedFilters === 'object') {
      if (normalizedFilters.search) params.append('search', normalizedFilters.search);
      if (normalizedFilters.state && normalizedFilters.state !== 'All States' && normalizedFilters.state !== 'ALL') params.append('state', normalizedFilters.state);
      if (normalizedFilters.city && normalizedFilters.city !== 'ALL') params.append('city', normalizedFilters.city);
      if (normalizedFilters.district) params.append('district', normalizedFilters.district);
      if (normalizedFilters.facility_type && normalizedFilters.facility_type !== 'All Types' && normalizedFilters.facility_type !== 'ALL') params.append('facility_type', normalizedFilters.facility_type);
      if (normalizedFilters.lat != null) params.append('lat', normalizedFilters.lat);
      if (normalizedFilters.lng != null) params.append('lng', normalizedFilters.lng);
      if (normalizedFilters.radius != null) params.append('radius', normalizedFilters.radius);
      if (normalizedFilters.sortBy) params.append('sortBy', normalizedFilters.sortBy);
      if (normalizedFilters.page) params.append('page', normalizedFilters.page);
      if (normalizedFilters.limit) params.append('limit', normalizedFilters.limit);
    }

    const qs = params.toString() ? `?${params.toString()}` : '';

    try {
      const res = await this.request(`/hospitals${qs}`);
      if (res && res.success && Array.isArray(res.hospitals) && res.hospitals.length > 0) {
        return res;
      }
      // If server returns empty for unknown query, return server response
      if (res && res.success) {
        return res;
      }
      throw new Error('Empty hospital directory from API');
    } catch (err) {
      const isProd = Boolean(typeof import.meta !== 'undefined' && import.meta.env?.PROD) || (typeof process !== 'undefined' && process.env?.NODE_ENV === 'production');
      if (isProd) {
        return {
          success: false,
          error: 'SERVICE_UNAVAILABLE',
          message: 'Healthcare facility directory is temporarily unavailable. Please check connectivity and retry.',
          hospitals: [],
          total: 0,
          totalPages: 1
        };
      }
      // Resilient fallback to Authoritative National Hospital Engine for local dev only
      return await HospitalDirectoryEngine.queryHospitals(normalizedFilters);
    }
  }

  static async getHospitalById(id) {
    try {
      const res = await this.request(`/hospitals/${id}`);
      if (res?.success) return res;
      throw new Error('Hospital lookup failed');
    } catch (err) {
      const isProd = Boolean(typeof import.meta !== 'undefined' && import.meta.env?.PROD) || (typeof process !== 'undefined' && process.env?.NODE_ENV === 'production');
      if (isProd) {
        return { success: false, error: 'SERVICE_UNAVAILABLE', message: 'Healthcare facility details temporarily unavailable.' };
      }
      const hospital = await HospitalDirectoryEngine.getHospitalById(id);
      return { success: !!hospital, hospital };
    }
  }

  static async getHospitalDepartments(hospitalId) {
    try {
      const res = await this.request(`/hospitals/${hospitalId}/departments`);
      if (res?.success && Array.isArray(res.departments) && res.departments.length > 0) {
        return res;
      }
      throw new Error('Departments lookup failed');
    } catch (err) {
      const isProd = Boolean(typeof import.meta !== 'undefined' && import.meta.env?.PROD) || (typeof process !== 'undefined' && process.env?.NODE_ENV === 'production');
      if (isProd) {
        return { success: false, error: 'SERVICE_UNAVAILABLE', message: 'Healthcare facility departments temporarily unavailable.', departments: [] };
      }
      const departments = await HospitalDirectoryEngine.getHospitalDepartments(hospitalId);
      return { success: true, hospitalId, count: departments.length, departments };
    }
  }

  static async getHospitalDoctors(hospitalId, includeInactive = false) {
    const qs = includeInactive ? '?includeInactive=true' : '';
    return await this.request(`/hospitals/${hospitalId}/doctors${qs}`);
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

  static async transferPatient(hospitalId, patientId, targetDepartmentId) {
    return await this.request(`/hospitals/${hospitalId}/transfer-patient`, {
      method: 'POST',
      body: JSON.stringify({ patientId, targetDepartmentId })
    });
  }

  static async updatePatientCaseStatus(hospitalId, patientId, status) {
    return await this.request(`/hospitals/${hospitalId}/patients/${patientId}/case-status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
  }

  static async getPatientAdminRecord(hospitalId, patientId) {
    return await this.request(`/hospitals/${hospitalId}/patients/${patientId}/record`);
  }

  static async createDepartment(hospitalId, deptData) {
    return await this.request(`/hospitals/${hospitalId}/departments`, {
      method: 'POST',
      body: JSON.stringify(deptData)
    });
  }

  static async updateDepartment(hospitalId, deptId, deptData) {
    return await this.request(`/hospitals/${hospitalId}/departments/${deptId}`, {
      method: 'PUT',
      body: JSON.stringify(deptData)
    });
  }

  static async setDepartmentStatus(hospitalId, deptId, status) {
    return await this.request(`/hospitals/${hospitalId}/departments/${deptId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
  }

  static async registerDoctor(hospitalId, doctorData) {
    return await this.request(`/hospitals/${hospitalId}/doctors`, {
      method: 'POST',
      body: JSON.stringify(doctorData)
    });
  }

  static async updateDoctor(hospitalId, doctorId, doctorData) {
    return await this.request(`/hospitals/${hospitalId}/doctors/${doctorId}`, {
      method: 'PUT',
      body: JSON.stringify(doctorData)
    });
  }

  static async setDoctorStatus(hospitalId, doctorId, status, reassignActiveCases = false) {
    return await this.request(`/hospitals/${hospitalId}/doctors/${doctorId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, reassignActiveCases })
    });
  }

  static async resetDoctorPassword(hospitalId, doctorId, newPassword) {
    return await this.request(`/hospitals/${hospitalId}/doctors/${doctorId}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ newPassword })
    });
  }

  static async updateHospitalSettings(hospitalId, settingsData) {
    return await this.request(`/hospitals/${hospitalId}/settings`, {
      method: 'PUT',
      body: JSON.stringify(settingsData)
    });
  }

  static async getHospitalAuditLogs(hospitalId, queryParams = {}) {
    const params = new URLSearchParams();
    if (queryParams.limit) params.append('limit', queryParams.limit);
    if (queryParams.offset) params.append('offset', queryParams.offset);
    if (queryParams.action) params.append('action', queryParams.action);
    if (queryParams.resourceType) params.append('resourceType', queryParams.resourceType);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return await this.request(`/hospitals/${hospitalId}/audit-logs${qs}`);
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

  static async deletePatient(id) {
    return await this.request(`/patients/${id}`, {
      method: 'DELETE'
    });
  }

  // Doctor Actions
  static async updateClinicalRecord(patientId, editedFields) {
    return await this.request('/doctor/update-record', {
      method: 'POST',
      body: JSON.stringify({ patientId, editedFields })
    });
  }

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
    const baseUrl = getApiBaseUrl();
    if (baseUrl === null) {
      throw new Error('Backend API is not configured for this static deployment. Please set VITE_API_BASE_URL in your deployment settings.');
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('patientId', patientId || 'temp-patient');
    if (docTypeHint) {
      formData.append('docTypeHint', docTypeHint);
    }

    const token = this.getAuthToken();
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    const response = await fetch(`${baseUrl}/documents/upload`, {
      method: 'POST',
      headers,
      body: formData
    });

    const data = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(data?.message || 'Document upload failed');
    }
    return data;
  }

  // Patient Digitized Documents Retrieval (Hospital & Patient Scoped)
  static async getPatientDocuments(patientId) {
    return await this.request(`/documents/patient/${patientId}`);
  }

  // Document Clinical Verification by Doctor
  static async verifyDocument(docId, diagnosis, docDate) {
    return await this.request(`/documents/${docId}/verify`, {
      method: 'PATCH',
      body: JSON.stringify({ diagnosis, docDate })
    });
  }

  // ABDM FHIR R4 Bundle Export & Validation
  static async exportFhirBundle(patientId) {
    return await this.request(`/fhir/patient/${patientId}`);
  }

  static async validateFhirBundle(patientId) {
    return await this.request(`/fhir/patient/${patientId}/validate`);
  }

  // Hospital HIS Integration Dispatch
  static async dispatchHis(patientId) {
    return await this.request(`/his/dispatch/${patientId}`, {
      method: 'POST'
    });
  }
}
