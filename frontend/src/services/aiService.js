/*
 * Calily AI Service (Frontend)
 * Calls backend API for AI insights
 * 
 * Author: Ava Raper
 * Version: 2.1 - Fixed for browser
 */

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

class AIService {
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
          summary: "No entries logged this week. Start journaling to see your health patterns!",
          entryCount: 0
        };
      }

      // Call backend API
      const response = await fetch(`${API_URL}/ai/weekly-summary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ entries })
      });

      if (!response.ok) {
        throw new Error('Failed to generate summary');
      }

      return await response.json();

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
          message: "Need at least 5 journal entries to identify meaningful patterns. Keep journaling!"
        };
      }

      // Call backend API
      const response = await fetch(`${API_URL}/ai/analyze-patterns`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ entries })
      });

      if (!response.ok) {
        throw new Error('Failed to analyze patterns');
      }

      return await response.json();

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
          message: "Need at least 10 entries to identify potential triggers. Keep tracking!"
        };
      }

      // Call backend API
      const response = await fetch(`${API_URL}/ai/identify-triggers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ entries })
      });

      if (!response.ok) {
        throw new Error('Failed to identify triggers');
      }

      return await response.json();

    } catch (error) {
      console.error('Error identifying triggers:', error);
      throw new Error('Failed to identify triggers. Please try again.');
    }
  }
}

// Export singleton instance
const aiService = new AIService();
export default aiService;