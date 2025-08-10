const API_BASE_URL = 'http://localhost:5001/api';

class ApiService {
  async request(endpoint, options = {}) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options
    });
    if (!response.ok) throw new Error('Request failed');
    return response.json();
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

  async searchEntries(query) {
    return this.request(`/search?q=${encodeURIComponent(query)}`);
  }

  async getStats() {
    return this.request('/stats');
  }

  async getRecentEntries() {
    return this.request('/recent');
  }

  async exportEntries() {
    const data = await this.request('/export');
    const blob = new Blob([data.exportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'calily_export.txt';
    a.click();
    URL.revokeObjectURL(url);
  }
}

const apiService = new ApiService();
export default apiService;