/**
 * MediMitra API Client & Network Service Layer
 * 
 * Provides authenticated HTTP communication with the MediMitra clinical backend.
 * Implements graceful offline fallbacks and error resilience.
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

  // Staff Authentication
  static async login(username, password) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
    if (data.token) {
      this.setAuthToken(data.token);
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
      }
      return data;
    } catch {
      return null;
    }
  }

  // Patient Management
  static async getPatients(filters = {}) {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.triage) params.append('triage', filters.triage);
    if (filters.search) params.append('search', filters.search);

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
