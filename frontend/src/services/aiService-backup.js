/*
 * Calily AI Service - Hugging Face Implementation
 * 
 * Author: Ava Raper
 * Version: 3.0 - Hugging Face Edition
 */

class AIService {
  constructor() {
    // Hugging Face API configuration
    this.apiKey = process.env.REACT_APP_HF_API_KEY;
    this.apiUrl = 'https://api-inference.huggingface.co/models/';
    
    // Using Meta's Llama 2 7B Chat model (free, open-source, no restrictions)
    this.model = 'meta-llama/Llama-2-7b-chat-hf';
    
    if (!this.apiKey) {
      console.warn('Hugging Face API key not found. AI features will be limited.');
    }
  }

  /**
   * Call Hugging Face API
   */
  async callHuggingFace(prompt) {
    try {
      const response = await fetch(`${this.apiUrl}${this.model}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            max_new_tokens: 500,
            temperature: 0.7,
            top_p: 0.95,
            do_sample: true,
          }
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      
      // Hugging Face returns array of generated text
      if (Array.isArray(data) && data[0]?.generated_text) {
        return data[0].generated_text;
      }
      
      throw new Error('Unexpected response format');
      
    } catch (error) {
      console.error('Hugging Face API error:', error);
      throw error;
    }
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
          summary: "No entries logged this week. Start journaling to see your health patterns!",
          entryCount: 0
        };
      }

      // Prepare data for AI - format entries with dates
      const entryTexts = entries.map((entry, index) => {
        const date = new Date(entry.createdAt).toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric'
        });
        return `${date}: ${entry.text}`;
      }).join('\n');

      // Calculate date range
      const sortedEntries = [...entries].sort((a, b) => 
        new Date(a.createdAt) - new Date(b.createdAt)
      );
      const startDate = new Date(sortedEntries[0].createdAt).toLocaleDateString();
      const endDate = new Date(sortedEntries[sortedEntries.length - 1].createdAt).toLocaleDateString();

      // Create prompt for Llama
      const prompt = `You are a compassionate health analyst. Analyze these journal entries from ${startDate} to ${endDate} and provide a brief, supportive weekly summary.

Journal entries:
${entryTexts}

Provide a summary (4-5 sentences) that includes:
1. Overall week summary
2. Most common symptoms
3. Any patterns observed
4. A brief encouraging note

Keep it supportive and factual. Do NOT provide medical advice.

Summary:`;

      // Call Hugging Face API
      const response = await this.callHuggingFace(prompt);
      
      // Extract just the summary part (remove the prompt)
      const summary = response.replace(prompt, '').trim();

      return {
        summary: summary,
        entryCount: entries.length,
        dateRange: {
          start: startDate,
          end: endDate
        },
        generatedAt: new Date().toISOString()
      };

    } catch (error) {
      console.error('Error generating weekly summary:', error);
      
      if (error.message?.includes('API key')) {
        throw new Error('AI features require a valid Hugging Face API key. Please add REACT_APP_HF_API_KEY to your .env file.');
      }
      
      // Fallback to basic summary if AI fails
      const sortedEntries = [...entries].sort((a, b) => 
        new Date(a.createdAt) - new Date(b.createdAt)
      );
      const startDate = new Date(sortedEntries[0].createdAt).toLocaleDateString();
      const endDate = new Date(sortedEntries[sortedEntries.length - 1].createdAt).toLocaleDateString();
      
      return {
        summary: `You logged ${entries.length} entries from ${startDate} to ${endDate}. Keep tracking your health patterns!`,
        entryCount: entries.length,
        dateRange: { start: startDate, end: endDate },
        generatedAt: new Date().toISOString()
      };
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

      // Get recent entries for detailed analysis
      const recentEntries = entries.slice(0, 30);
      const entryTexts = recentEntries.map((entry) => {
        const date = new Date(entry.createdAt).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric'
        });
        return `${date}: ${entry.text}`;
      }).join('\n');

      // Extract symptom frequency
      const symptomCounts = this.extractSymptomFrequency(entries);
      const topSymptoms = Object.entries(symptomCounts)
        .slice(0, 5)
        .map(([symptom, count]) => `${symptom}: ${count} times`)
        .join(', ');

      const prompt = `Analyze these ${recentEntries.length} health journal entries for patterns:

Entries:
${entryTexts}

Most frequent symptoms: ${topSymptoms}

Identify:
1. Top 3 most common symptoms
2. Any patterns (timing, clusters)
3. Correlations between symptoms and activities
4. 2-3 questions to ask a doctor

Provide observations only, not medical advice.

Analysis:`;

      const response = await this.callHuggingFace(prompt);
      const analysis = response.replace(prompt, '').trim();

      return {
        patterns: analysis,
        symptomFrequency: symptomCounts,
        entriesAnalyzed: recentEntries.length,
        totalEntries: entries.length,
        generatedAt: new Date().toISOString()
      };

    } catch (error) {
      console.error('Error analyzing patterns:', error);
      
      // Fallback to basic pattern analysis
      const symptomCounts = this.extractSymptomFrequency(entries);
      const topSymptoms = Object.entries(symptomCounts)
        .slice(0, 3)
        .map(([symptom, count]) => `• ${symptom}: mentioned ${count} times`)
        .join('\n');
      
      return {
        patterns: `Pattern Analysis:\n\nTop Symptoms:\n${topSymptoms}\n\nYou have ${entries.length} total entries. Common patterns may emerge with more data.`,
        symptomFrequency: symptomCounts,
        entriesAnalyzed: Math.min(entries.length, 30),
        totalEntries: entries.length,
        generatedAt: new Date().toISOString()
      };
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

      // Group entries by symptom severity
      const severeEntries = entries.filter(e => {
        const text = e.text.toLowerCase();
        return text.includes('flare') || text.includes('bad') || 
               text.includes('severe') || text.includes('worse') ||
               text.includes('terrible') || text.includes('awful');
      });

      const mildEntries = entries.filter(e => {
        const text = e.text.toLowerCase();
        return text.includes('better') || text.includes('good') || 
               text.includes('mild') || text.includes('improved') ||
               text.includes('great') || text.includes('well');
      });

      const severeTexts = severeEntries.slice(0, 10)
        .map(e => `- ${e.text}`)
        .join('\n');
      
      const mildTexts = mildEntries.slice(0, 10)
        .map(e => `- ${e.text}`)
        .join('\n');

      const prompt = `Analyze these journal entries to identify potential health triggers:

WORSE DAYS (${severeEntries.length} entries):
${severeTexts || 'Not enough data'}

BETTER DAYS (${mildEntries.length} entries):
${mildTexts || 'Not enough data'}

Identify:
1. Potential triggers on worse days
2. Factors on better days  
3. Patterns to monitor

Use cautious language. Observations only, not medical advice.

Analysis:`;

      const response = await this.callHuggingFace(prompt);
      const triggers = response.replace(prompt, '').trim();

      return {
        triggers: triggers,
        severeEntryCount: severeEntries.length,
        mildEntryCount: mildEntries.length,
        generatedAt: new Date().toISOString()
      };

    } catch (error) {
      console.error('Error identifying triggers:', error);
      
      // Fallback analysis
      const severeEntries = entries.filter(e => {
        const text = e.text.toLowerCase();
        return text.includes('flare') || text.includes('bad') || text.includes('severe');
      });
      
      const mildEntries = entries.filter(e => {
        const text = e.text.toLowerCase();
        return text.includes('better') || text.includes('good');
      });
      
      return {
        triggers: `Trigger Analysis:\n\n• Worse days: ${severeEntries.length} entries\n• Better days: ${mildEntries.length} entries\n\nContinue tracking to identify patterns between symptoms and activities, sleep, diet, stress, and weather.`,
        severeEntryCount: severeEntries.length,
        mildEntryCount: mildEntries.length,
        generatedAt: new Date().toISOString()
      };
    }
  }

  /**
   * Helper: Extract symptom frequency from entries
   * @param {Array} entries - Journal entries
   * @returns {Object} Symptom counts
   */
  extractSymptomFrequency(entries) {
    const symptomKeywords = [
      'fatigue', 'tired', 'exhausted', 'pain', 'ache', 'headache', 
      'migraine', 'dizzy', 'dizziness', 'nausea', 'sick',
      'brain fog', 'anxiety', 'anxious', 'stress', 'stressed',
      'sleep', 'insomnia', 'flare', 'swelling', 'inflammation',
      'weak', 'weakness', 'numbness', 'tingling'
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

    // Sort by frequency (highest first)
    return Object.fromEntries(
      Object.entries(counts).sort(([,a], [,b]) => b - a)
    );
  }
}

// Export singleton instance
const aiService = new AIService();
export default aiService;