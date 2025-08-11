/*
 * Calily
 * API service layer for frontend-backend communication
 *
 * Author: Ava Raper
 * Version: 1.0
 */

const API_BASE_URL = 'http://localhost:5001/api';

// API service class for all backend requests
class ApiService {
  // base request method with error handling
  async request(endpoint, options = {}) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options
    });
    if (!response.ok) throw new Error('Request failed');
    return response.json();
  }

  // get all entries from backend
  async getEntries() {
    return this.request('/entries');
  }

  // create new entry with text
  async createEntry(text) {
    return this.request('/entries', {
      method: 'POST',
      body: JSON.stringify({ text })
    });
  }

  // delete entry by ID
  async deleteEntry(id) {
    return this.request(`/entries/${id}`, {
      method: 'DELETE'
    });
  }

  // search entries by query text
  async searchEntries(query) {
    return this.request(`/search?q=${encodeURIComponent(query)}`);
  }
}

const apiService = new ApiService();
export default apiService;