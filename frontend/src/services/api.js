/*
 * Calily
 * API service layer for frontend-backend communication
 * Configured for Render backend deployment
 * Updated with medication methods
 */

// Determine API base URL based on environment
const getApiBaseUrl = () => {
  if (process.env.NODE_ENV === 'production') {
    return process.env.REACT_APP_API_URL || 'https://calily-api.onrender.com';
  }
  return 'http://localhost:5001';
};

const API_BASE_URL = getApiBaseUrl();

class ApiService {
  getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }

  async request(endpoint, options = {}) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: this.getAuthHeaders(),
        signal: controller.signal,
        ...options
      });

      clearTimeout(timeoutId);

      if (response.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/auth';
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // ===== JOURNAL ENTRIES =====

  async getEntries() {
    return this.request('/api/entries');
  }

  async createEntry(text, image = null) {
    const body = { text };
    if (image) {
      body.image = image;
    }
    return this.request('/api/entries', {
      method: 'POST',
      body: JSON.stringify(body)
    });
  }

  async updateEntry(id, text, image = null, removeImage = false) {
    const body = { text };
    if (removeImage) {
      body.removeImage = true;
    } else if (image) {
      body.image = image;
    }
    return this.request(`/api/entries/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body)
    });
  }

  async deleteEntry(id) {
    return this.request(`/api/entries/${id}`, {
      method: 'DELETE'
    });
  }

  async searchEntries(query) {
    return this.request(`/api/search?q=${encodeURIComponent(query)}`);
  }

  // ===== MEDICATIONS =====

  async getMedications() {
    return this.request('/api/medications');
  }

  async createMedication(medication) {
    return this.request('/api/medications', {
      method: 'POST',
      body: JSON.stringify(medication)
    });
  }

  // ENHANCED: Toggle specific dose (e.g., "2025-11-10-Morning")
  async toggleMedicationDose(id, doseKey, taken) {
    return this.request(`/api/medications/${id}/toggle-dose`, {
      method: 'PUT',
      body: JSON.stringify({ doseKey, taken })
    });
  } 

  async toggleMedication(id, date, taken) {
    return this.request(`/api/medications/${id}/toggle`, {
      method: 'PUT',
      body: JSON.stringify({ date, taken })
    });
  }

  async deleteMedication(id) {
    return this.request(`/api/medications/${id}`, {
      method: 'DELETE'
    });
  }
}

const apiService = new ApiService();
export default apiService;