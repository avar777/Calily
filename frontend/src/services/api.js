/*
 * Calily
 * API service layer for frontend-backend communication
 * Configured for Render backend deployment
 */

// Determine API base URL based on environment
const getApiBaseUrl = () => {
  if (process.env.NODE_ENV === 'production') {
    // Your Render backend URL (replace 'your-app-name' with actual Render service name)
    return process.env.REACT_APP_API_URL || 'https://calily-backend.onrender.com/api';
  }
  return 'http://localhost:5001/api';
};

const API_BASE_URL = getApiBaseUrl();

class ApiService {
  async request(endpoint, options = {}) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: { 
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
        ...options
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      return response.json();
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timeout. Please check your connection and try again.');
      }
      console.error('API request failed:', error);
      throw new Error(error.message || 'Network request failed. Please try again.');
    }
  }

  async getEntries() {
    return this.request('/entries');
  }

  async createEntry(text) {
    return this.request('/entries', {
      method: 'POST',
      body: JSON.stringify({ text })
    });
  }

  async deleteEntry(id) {
    return this.request(`/entries/${id}`, {
      method: 'DELETE'
    });
  }

  async searchEntries(query) {
    return this.request(`/search?q=${encodeURIComponent(query)}`);
  }
}

const apiService = new ApiService();
export default apiService;