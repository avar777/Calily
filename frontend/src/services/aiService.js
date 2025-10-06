/*
 * Calily AI Service
 * Generative AI implementation for health pattern analysis and insights
 * 
 * Author: Ava Raper
 * Version: 2.0
 */

import OpenAI from 'openai';

class AIService {
  constructor() {
    // Initialize OpenAI client
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || process.env.REACT_APP_OPENAI_API_KEY
    });
    
    // Configuration
    this.model = 'gpt-4'; // or 'gpt-3.5-turbo' for lower cost
    this.maxTokens = 500;
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

      // Prepare data for AI
      const entryTexts = entries.map((entry, index) => {
        const date = new Date(entry.createdAt).toLocaleDateString();
        return `Day ${index + 1} (${date}): ${entry.text}`;
      }).join('\n');

      // Create AI prompt
      const prompt = `You are a health data analyst helping someone with an autoimmune condition (like POTS) understand their weekly health patterns.

Analyze these journal entries from the past week:

${entryTexts}

Provide a brief summary that includes:
1. Overall week summary (2-3 sentences)
2. Most common symptoms mentioned
3. Any notable patterns or observations
4. Encouraging note

Keep it concise, supportive, and factual. Do NOT provide medical advice or diagnosis. Focus on observations only.`;

      // Call OpenAI API
      const completion = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are a compassionate health data analyst who helps people with chronic illnesses understand their health patterns through their journal entries. You provide observations, not medical advice.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: this.maxTokens,
        temperature: 0.7
      });

      const summary = completion.choices[0].message.content;

      return {
        summary: summary,
        entryCount: entries.length,
        dateRange: {
          start: new Date(entries[entries.length - 1].createdAt).toLocaleDateString(),
          end: new Date(entries[0].createdAt).toLocaleDateString()
        },
        generatedAt: new Date().toISOString()
      };

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

      // Prepare data - get symptom frequency
      const symptomCounts = this.extractSymptomFrequency(entries);
      const entryTexts = entries.slice(0, 30).map((entry, index) => {
        const date = new Date(entry.createdAt).toLocaleDateString();
        return `${date}: ${entry.text}`;
      }).join('\n');

      const prompt = `You are analyzing health journal entries for someone with an autoimmune condition to identify patterns.

Recent journal entries:
${entryTexts}

Symptom frequency from all entries:
${JSON.stringify(symptomCounts, null, 2)}

Identify:
1. Top 3 most common symptoms or complaints
2. Any patterns you notice (timing, clusters, potential triggers)
3. Correlations between symptoms and activities/factors mentioned
4. 2-3 questions the user should ask their doctor

Format your response as clear, numbered points. Focus on OBSERVATIONS only, not medical advice.`;

      const completion = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are a health pattern analyst. Identify patterns in health data and present them clearly. Never diagnose or prescribe. Only observe and suggest questions for healthcare providers.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 600,
        temperature: 0.6
      });

      const analysis = completion.choices[0].message.content;

      return {
        patterns: analysis,
        symptomFrequency: symptomCounts,
        entriesAnalyzed: Math.min(entries.length, 30),
        totalEntries: entries.length,
        generatedAt: new Date().toISOString()
      };

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

      // Group entries by symptom severity (basic keyword analysis)
      const severeEntries = entries.filter(e => 
        e.text.toLowerCase().includes('flare') || 
        e.text.toLowerCase().includes('bad') || 
        e.text.toLowerCase().includes('severe') ||
        e.text.toLowerCase().includes('worse')
      );

      const mildEntries = entries.filter(e => 
        e.text.toLowerCase().includes('better') || 
        e.text.toLowerCase().includes('good') || 
        e.text.toLowerCase().includes('mild')
      );

      const severeTexts = severeEntries.slice(0, 10).map(e => e.text).join('\n');
      const mildTexts = mildEntries.slice(0, 10).map(e => e.text).join('\n');

      const prompt = `Analyze these health journal entries to identify potential triggers for symptom flares.

WORSE SYMPTOM DAYS:
${severeTexts || 'Not enough data'}

BETTER SYMPTOM DAYS:
${mildTexts || 'Not enough data'}

Identify:
1. Potential triggers that appear before worse days (sleep, stress, weather, food, activity)
2. Factors present on better days
3. Patterns worth monitoring further

Be specific but cautious. Use phrases like "may be related to" or "appears to correlate with". Do not make definitive medical claims.`;

      const completion = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are a health data analyst identifying potential correlations and triggers in symptom patterns. Be cautious and emphasize correlation, not causation.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 500,
        temperature: 0.6
      });

      return {
        triggers: completion.choices[0].message.content,
        severeEntryCount: severeEntries.length,
        mildEntryCount: mildEntries.length,
        generatedAt: new Date().toISOString()
      };

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
      const recentEntries = entries.slice(0, 20).map(e => {
        const date = new Date(e.createdAt).toLocaleDateString();
        return `${date}: ${e.text}`;
      }).join('\n');

      const prompt = `User question: "${question}"

Recent health journal entries:
${recentEntries}

Answer the user's question based on their journal data. Be specific and reference their actual entries. If the data doesn't contain enough information to answer, say so politely. Do not provide medical advice.`;

      const completion = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant answering questions about a user\'s health journal. Use their data to provide specific, factual answers. Never diagnose or provide medical advice.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 300,
        temperature: 0.7
      });

      return {
        question: question,
        answer: completion.choices[0].message.content,
        entriesReferenced: Math.min(entries.length, 20),
        generatedAt: new Date().toISOString()
      };

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
      const recentEntries = entries.slice(0, 15).map(e => {
        const date = new Date(e.createdAt).toLocaleDateString();
        return `${date}: ${e.text}`;
      }).join('\n');

      const medList = medications.length > 0 
        ? medications.map(m => `${m.name} - ${m.dosage}`).join(', ')
        : 'No medications tracked';

      const prompt = `Prepare a concise summary for a doctor's appointment based on this health data.

Recent symptoms/activities:
${recentEntries}

Current medications: ${medList}

Create:
1. Brief summary of recent health status (2-3 sentences)
2. Key symptoms or concerns to discuss
3. 3-5 specific questions to ask the doctor
4. Any changes or patterns worth mentioning

Keep it concise and doctor-friendly. Focus on actionable information.`;

      const completion = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are helping prepare a concise, professional summary for a doctor\'s appointment. Focus on key information healthcare providers need to know.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 500,
        temperature: 0.6
      });

      return {
        summary: completion.choices[0].message.content,
        entriesIncluded: Math.min(entries.length, 15),
        medicationsIncluded: medications.length,
        generatedAt: new Date().toISOString()
      };

    } catch (error) {
      console.error('Error preparing doctor visit summary:', error);
      throw new Error('Failed to generate doctor visit summary. Please try again.');
    }
  }

  /**
   * Helper: Extract symptom frequency from entries
   * @param {Array} entries - Journal entries
   * @returns {Object} Symptom counts
   */
  extractSymptomFrequency(entries) {
    const symptomKeywords = [
      'fatigue', 'tired', 'pain', 'headache', 'dizzy', 'nausea',
      'brain fog', 'anxiety', 'stress', 'sleep', 'flare'
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