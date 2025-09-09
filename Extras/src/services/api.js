/*
 * Calily
 * API service layer for frontend-backend communication
 * Updated for production deployment
 */

// Determine API base URL based on environment
const getApiBaseUrl = () => {
  if (process.env.NODE_ENV === 'production') {
    // Replace with your deployed backend URL
    return process.env.REACT_APP_API_URL || 'https://your-backend-app.vercel.app/api';
  }
  return 'http://localhost:5001/api';
};

const API_BASE_URL = getApiBaseUrl();

// API service class for all backend requests
class ApiService {
  // base request method with error handling
  async request(endpoint, options = {}) {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: { 'Content-Type': 'application/json' },
        ...options
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw new Error('Network request failed. Please try again.');
    }
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