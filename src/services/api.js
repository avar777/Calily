const API_BASE_URL = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5000';

class ApiService {
  
  async handleResponse(response) {
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }
    return response.json();
  }

  async getEntries() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/entries`);
      return this.handleResponse(response);
    } catch (error) {
      console.error('Error fetching entries:', error);
      throw error;
    }
  }

  async createEntry(text) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/entries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });
      return this.handleResponse(response);
    } catch (error) {
      console.error('Error creating entry:', error);
      throw error;
    }
  }

  async searchEntries(query) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/entries/search?q=${encodeURIComponent(query)}`
      );
      return this.handleResponse(response);
    } catch (error) {
      console.error('Error searching entries:', error);
      throw error;
    }
  }
}

const apiService = new ApiService();
export default apiService;