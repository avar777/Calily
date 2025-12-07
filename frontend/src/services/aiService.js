/*
 * Calily AI Service
 * Frontend service that calls backend AI endpoints
 * 
 * Author: Ava Raper
 * Version: 4.0 - Backend API calls (secure)
 */

class AIService {
  constructor() {
    // API base URL - change for production
    this.apiBaseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5001';
  }

  /**
   * Get auth token from localStorage
   * @returns {string|null} Auth token
   */
  getAuthToken() {
    return localStorage.getItem('token');
  }

  /**
   * Make authenticated API call
   * @param {string} endpoint - API endpoint
   * @param {object} data - Request body
   * @returns {Promise} API response
   */
  async makeRequest(endpoint, data) {
    const token = this.getAuthToken();
    
    const response = await fetch(`${this.apiBaseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'API request failed');
    }

    return response.json();
  }

  /**
   * Generate weekly health summary from journal entries
   * @param {Array} entries - Array of journal entries from the past week
   * @returns {Object} AI-generated summary
   */
  async generateWeeklySummary(entries) {
    try {
      // Validate input
      if (!entries || entries.length === 0) {
        return {
          summary: "No entries logged this week. Start journaling to see your health patterns.",
          entryCount: 0
        };
      }

      const result = await this.makeRequest('/api/ai/weekly-summary', { entries });
      return result;

    } catch (error) {
      console.error('Error generating weekly summary:', error);
      throw new Error('Failed to generate weekly summary. Please try again.');
    }
  }

  /**
   * Analyze health patterns from journal entries
   * @param {Array} entries - All journal entries for analysis
   * @returns {Object} Identified patterns and correlations
   */
  async analyzePatterns(entries) {
    try {
      if (!entries || entries.length < 5) {
        return {
          patterns: [],
          message: "Need at least 5 journal entries to identify meaningful patterns."
        };
      }

      const result = await this.makeRequest('/api/ai/analyze-patterns', { entries });
      return result;

    } catch (error) {
      console.error('Error analyzing patterns:', error);
      throw new Error('Failed to analyze patterns. Please try again.');
    }
  }

  /**
   * Identify potential health triggers from entries
   * @param {Array} entries - Journal entries to analyze
   * @returns {Object} Identified triggers and correlations
   */
  async identifyTriggers(entries) {
    try {
      if (!entries || entries.length < 10) {
        return {
          triggers: [],
          message: "Need at least 10 entries to identify potential triggers."
        };
      }

      const result = await this.makeRequest('/api/ai/identify-triggers', { entries });
      return result;

    } catch (error) {
      console.error('Error identifying triggers:', error);
      throw new Error('Failed to identify triggers. Please try again.');
    }
  }

  /**
   * Answer natural language questions about health data
   * @param {String} question - User's question
   * @param {Array} entries - Journal entries for context
   * @returns {Object} AI-generated answer
   */
  async answerHealthQuery(question, entries) {
    try {
      if (!question || !entries || entries.length === 0) {
        throw new Error('Question and entries are required');
      }

      const result = await this.makeRequest('/api/ai/health-query', { 
        question, 
        entries 
      });
      return result;

    } catch (error) {
      console.error('Error answering query:', error);
      throw new Error('Failed to answer question. Please try again.');
    }
  }

  /**
   * Generate doctor visit preparation summary
   * @param {Array} entries - Recent journal entries
   * @param {Array} medications - Current medications (optional)
   * @returns {Object} Visit preparation summary
   */
  async prepareDoctorVisit(entries, medications = []) {
    try {
      if (!entries || entries.length === 0) {
        throw new Error('Entries are required');
      }

      const result = await this.makeRequest('/api/ai/doctor-visit', { 
        entries, 
        medications 
      });
      return result;

    } catch (error) {
      console.error('Error preparing doctor visit summary:', error);
      throw new Error('Failed to generate doctor visit summary. Please try again.');
    }
  }

  /**
   * Get AI-powered trend analysis with graph data
   * @param {Array} entries - All journal entries for analysis
   * @param {Array} medications - Current medications (optional)
   * @returns {Object} Trend analysis with daily scores and insights
   */
  async getTrendAnalysis(entries, medications = []) {
    try {
      if (!entries || entries.length < 3) {
        return {
          message: "Need at least 3 entries to generate trend analysis",
          dailyScores: [],
          insights: {}
        };
      }

      const result = await this.makeRequest('/api/ai/trend-analysis', { 
        entries, 
        medications 
      });
      return result;

    } catch (error) {
      console.error('Error generating trend analysis:', error);
      throw new Error('Failed to generate trend analysis. Please try again.');
    }
  }

  /**
   * Helper: Extract symptom frequency from entries (client-side)
   * @param {Array} entries - Journal entries
   * @returns {Object} Symptom counts
   */
  extractSymptomFrequency(entries) {
    const symptomKeywords = [
      'fatigue', 'tired', 'pain', 'headache', 'dizzy', 'nausea',
      'brain fog', 'anxiety', 'stress', 'sleep', 'flare', 
      'exhausted', 'ache', 'migraine', 'nauseous', 'brain fog', 'foggy', 'weak', 'tremor',
      'fever', 'chills', 'sweating', 'rash', 'itch', 'swelling', 'inflammation',
      'stiff', 'sore', 'cramping', 'numbness', 'tingling',
     
    ];

    const counts = {};
    symptomKeywords.forEach(symptom => {
      const count = entries.filter(e => 
        e.text.toLowerCase().includes(symptom)
      ).length;
      if (count > 0) {
        counts[symptom] = count;
      }
    });

    // Sort by frequency
    return Object.fromEntries(
      Object.entries(counts).sort(([,a], [,b]) => b - a)
    );
  }
}

// Export singleton instance
const aiService = new AIService();
export default aiService;