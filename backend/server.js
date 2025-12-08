/*
 * Calily - Express server with Google AI Studio API
 * Now with rate limiting and caching
 */
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const routes = require('./routes');
require('dotenv').config();
const authRoutes = require('./authRoutes');
const authMiddleware = require('./authMiddleware');
const medicationRoutes = require('./medicationRoutes');

const app = express();
const PORT = process.env.PORT || 5001;

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/calily';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// CORS configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? [
        'https://calily-api.vercel.app',
        'https://calily-api-git-main-avar777s-projects.vercel.app',
        'https://calily-4bux08ddl-avar777s-projects.vercel.app',
        'http://localhost:3000',
        /https:\/\/calily.*\.vercel\.app$/,
        process.env.FRONTEND_URL
      ].filter(Boolean)
    : ['http://localhost:3000'],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ============================================
// RATE LIMITING SYSTEM
// ============================================
let requestCount = 0;
let lastResetTime = Date.now();
const DAILY_LIMIT = 200; // Leave buffer below 250 limit
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour cache

// Simple in-memory cache
const cache = new Map();

function checkRateLimit() {
  const now = Date.now();
  
  // Reset counter every 24 hours
  if (now - lastResetTime > 24 * 60 * 60 * 1000) {
    requestCount = 0;
    lastResetTime = now;
    console.log('Rate limit counter reset');
  }
  
  if (requestCount >= DAILY_LIMIT) {
    const hoursUntilReset = Math.ceil((24 * 60 * 60 * 1000 - (now - lastResetTime)) / (60 * 60 * 1000));
    throw new Error(`Daily API limit reached (${DAILY_LIMIT} requests). Please try again in ${hoursUntilReset} hours.`);
  }
  
  requestCount++;
  console.log(`API requests today: ${requestCount}/${DAILY_LIMIT}`);
}

function getCacheKey(endpoint, data) {
  return `${endpoint}-${JSON.stringify(data)}`;
}

function getCachedResponse(key) {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log('Returning cached response for:', key.substring(0, 50));
    return cached.data;
  }
  return null;
}

function setCachedResponse(key, data) {
  cache.set(key, { data, timestamp: Date.now() });
  
  // Clean old cache entries (keep cache size manageable)
  if (cache.size > 100) {
    const oldestKey = cache.keys().next().value;
    cache.delete(oldestKey);
  }
}

// ============================================
// Google AI Studio API Helper
// ============================================
async function callGeminiAPI(prompt) {
  checkRateLimit(); // Check before making API call
  
  const apiKey = process.env.GEMINI_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: prompt
        }]
      }]
    })
  });

  if (!response.ok) {
    const error = await response.text();
    const errorObj = JSON.parse(error);
    
    // Better error messages for quota issues
    if (errorObj.error?.code === 429) {
      throw new Error('Daily API quota exceeded. Please try again tomorrow or upgrade your API plan.');
    }
    
    throw new Error(`Gemini API error: ${error}`);
  }

  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}

// Public routes (no auth required)
app.use('/api/auth', authRoutes);

// Protect ALL /api routes with auth middleware (except /api/auth)
app.use('/api', authMiddleware);

// Protected API routes (auth required)
app.use('/api', routes);
app.use('/api', medicationRoutes);

// Health check endpoints
app.get('/', (req, res) => {
  res.json({ 
    status: 'Calily API is running', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    ai: 'Google Gemini 1.5 Flash (AI Studio)'
  });
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    ai: 'Google Gemini 1.5 Flash (AI Studio)',
    apiKeyConfigured: !!process.env.GEMINI_API_KEY,
    requestsToday: requestCount,
    requestsRemaining: DAILY_LIMIT - requestCount
  });
});

// ============================================
// AI Routes - Protected by auth middleware
// ============================================

// Weekly Summary
app.post('/api/ai/weekly-summary', async (req, res) => {
  try {
    const { entries } = req.body;

    if (!entries || entries.length === 0) {
      return res.json({
        summary: "No entries logged this week. Start journaling to see your health patterns!",
        entryCount: 0
      });
    }

    // Check cache first
    const cacheKey = getCacheKey('weekly-summary', entries.map(e => e._id));
    const cached = getCachedResponse(cacheKey);
    if (cached) {
      return res.json({ ...cached, fromCache: true });
    }

    const entryTexts = entries.map((entry, index) => {
      const date = new Date(entry.createdAt).toLocaleDateString();
      return `Day ${index + 1} (${date}): ${entry.text}`;
    }).join('\n');

    // Calculate time period for more accurate language
    const daysDiff = Math.ceil((new Date(entries[0].createdAt) - new Date(entries[entries.length - 1].createdAt)) / (1000 * 60 * 60 * 24));
    const timePeriod = daysDiff <= 7 ? 'week' : daysDiff <= 30 ? 'month' : 'time period';
    
    const prompt = `You are a compassionate health data analyst who helps people with chronic illnesses understand their health patterns through their journal entries. You provide observations, not medical advice.

Analyze these journal entries from the past ${timePeriod}:

${entryTexts}

Provide a brief summary with clear section headers. Format your response using markdown:
- Use **bolded headers** for each section (e.g., **Overall ${timePeriod} summary:**)
- Use bullet points (*) for lists
- Keep it concise and easy to scan

Include these sections:
1. **Overall ${timePeriod} summary:** (2-3 sentences about the ${timePeriod}'s patterns)
2. **Most common symptoms mentioned:** (bullet list of key symptoms)
3. **Notable patterns or observations:** (bullet list of any interesting trends)
4. **Encouraging note:** (supportive closing thought)

Keep it supportive and factual. Do NOT provide medical advice or diagnosis. Focus on observations only.`;

    const summary = await callGeminiAPI(prompt);

    const response = {
      summary: summary,
      entryCount: entries.length,
      dateRange: {
        start: new Date(entries[entries.length - 1].createdAt).toLocaleDateString(),
        end: new Date(entries[0].createdAt).toLocaleDateString()
      },
      generatedAt: new Date().toISOString()
    };

    // Cache the response
    setCachedResponse(cacheKey, response);

    res.json(response);
    
  } catch (error) {
    console.error('Error generating weekly summary:', error);
    res.status(500).json({ error: error.message || 'Failed to generate summary. Please try again.' });
  }
});

// Analyze Patterns
app.post('/api/ai/analyze-patterns', async (req, res) => {
  try {
    const { entries } = req.body;

    if (!entries || entries.length < 5) {
      return res.json({
        patterns: [],
        message: "Need at least 5 journal entries to identify meaningful patterns. Keep journaling!"
      });
    }

    // Check cache first
    const cacheKey = getCacheKey('analyze-patterns', entries.slice(0, 30).map(e => e._id));
    const cached = getCachedResponse(cacheKey);
    if (cached) {
      return res.json({ ...cached, fromCache: true });
    }

    // Extract symptom frequency
    const symptomKeywords = [
      'fatigue', 'tired', 'pain', 'headache', 'dizzy', 'nausea',
      'brain fog', 'anxiety', 'stress', 'sleep', 'flare'
    ];

    const symptomCounts = {};
    symptomKeywords.forEach(symptom => {
      const count = entries.filter(e => 
        e.text.toLowerCase().includes(symptom)
      ).length;
      if (count > 0) {
        symptomCounts[symptom] = count;
      }
    });

    const sortedSymptoms = Object.fromEntries(
      Object.entries(symptomCounts).sort(([,a], [,b]) => b - a)
    );

    const entryTexts = entries.slice(0, 30).map((entry) => {
      const date = new Date(entry.createdAt).toLocaleDateString();
      return `${date}: ${entry.text}`;
    }).join('\n');

    const prompt = `You are a health pattern analyst. Identify patterns in health data and present them clearly. Never diagnose or prescribe. Only observe and suggest questions for healthcare providers.

Recent journal entries:
${entryTexts}

Symptom frequency from all entries:
${JSON.stringify(sortedSymptoms, null, 2)}

Format your response using markdown with clear headers:
- Use **bolded headers** for each section (e.g., **Top 3 Most Common Symptoms or Complaints:**)
- Use bullet points (*) for lists
- Make it scannable and well-organized

Identify and format as sections:
1. **Top 3 Most Common Symptoms or Complaints:** (bullet list with details)
2. **Patterns Noticed:** (bullet list of timing, clusters, potential triggers)
3. **Correlations Between Symptoms and Activities:** (bullet list of observed connections)
4. **Questions to Ask Your Doctor:** (bullet list of 2-3 specific questions)

Focus on OBSERVATIONS only, not medical advice.`;

    const analysis = await callGeminiAPI(prompt);

    const response = {
      patterns: analysis,
      symptomFrequency: sortedSymptoms,
      entriesAnalyzed: Math.min(entries.length, 30),
      totalEntries: entries.length,
      generatedAt: new Date().toISOString()
    };

    // Cache the response
    setCachedResponse(cacheKey, response);

    res.json(response);
    
  } catch (error) {
    console.error('Error analyzing patterns:', error);
    res.status(500).json({ error: error.message || 'Failed to analyze patterns. Please try again.' });
  }
});

// Identify Triggers
app.post('/api/ai/identify-triggers', async (req, res) => {
  try {
    const { entries } = req.body;

    if (!entries || entries.length < 10) {
      return res.json({
        triggers: [],
        message: "Need at least 10 entries to identify potential triggers. Keep tracking!"
      });
    }

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

    // Check cache first
    const cacheKey = getCacheKey('identify-triggers', {
      severe: severeEntries.slice(0, 10).map(e => e._id),
      mild: mildEntries.slice(0, 10).map(e => e._id)
    });
    const cached = getCachedResponse(cacheKey);
    if (cached) {
      return res.json({ ...cached, fromCache: true });
    }

    const severeTexts = severeEntries.slice(0, 10).map(e => e.text).join('\n');
    const mildTexts = mildEntries.slice(0, 10).map(e => e.text).join('\n');

    const prompt = `You are a health data analyst identifying potential correlations and triggers in symptom patterns. Be cautious and emphasize correlation, not causation.

Analyze these health journal entries to identify potential triggers for symptom flares.

WORSE SYMPTOM DAYS:
${severeTexts || 'Not enough data'}

BETTER SYMPTOM DAYS:
${mildTexts || 'Not enough data'}

Format your response using markdown with clear headers:
- Use **bolded headers** for each section (e.g., **# 1. Potential Triggers that Appear Before Worse Days:**)
- Use bullet points (*) for lists
- Make it scannable and well-organized

Identify and format as sections:
**1. Potential Triggers that Appear Before Worse Days:**
(bullet list of triggers like sleep, stress, weather, food, activity)

**2. Factors Present on Better Days:**
(bullet list of positive factors or patterns)

**3. Patterns Worth Monitoring Further:**
(bullet list of observations that need more tracking)

Be specific but cautious. Use phrases like "may be related to" or "appears to correlate with". Do not make definitive medical claims.`;

    const triggers = await callGeminiAPI(prompt);

    const response = {
      triggers: triggers,
      severeEntryCount: severeEntries.length,
      mildEntryCount: mildEntries.length,
      generatedAt: new Date().toISOString()
    };

    // Cache the response
    setCachedResponse(cacheKey, response);

    res.json(response);
    
  } catch (error) {
    console.error('Error identifying triggers:', error);
    res.status(500).json({ error: error.message || 'Failed to identify triggers. Please try again.' });
  }
});

// Answer Health Query
app.post('/api/ai/health-query', async (req, res) => {
  try {
    const { question, entries } = req.body;

    if (!question || !entries || entries.length === 0) {
      return res.status(400).json({ error: 'Question and entries are required' });
    }

    // Check cache first
    const cacheKey = getCacheKey('health-query', {
      question,
      entries: entries.slice(0, 20).map(e => e._id)
    });
    const cached = getCachedResponse(cacheKey);
    if (cached) {
      return res.json({ ...cached, fromCache: true });
    }

    const recentEntries = entries.slice(0, 20).map(e => {
      const date = new Date(e.createdAt).toLocaleDateString();
      return `${date}: ${e.text}`;
    }).join('\n');

    const prompt = `You are a helpful assistant answering questions about a user's health journal. Use their data to provide specific, factual answers. Never diagnose or provide medical advice.

User question: "${question}"

Recent health journal entries:
${recentEntries}

Answer the user's question based on their journal data. Be specific and reference their actual entries. If the data doesn't contain enough information to answer, say so politely. Do not provide medical advice.`;

    const answer = await callGeminiAPI(prompt);

    const response = {
      question: question,
      answer: answer,
      entriesReferenced: Math.min(entries.length, 20),
      generatedAt: new Date().toISOString()
    };

    // Cache the response
    setCachedResponse(cacheKey, response);

    res.json(response);
    
  } catch (error) {
    console.error('Error answering query:', error);
    res.status(500).json({ error: error.message || 'Failed to answer question. Please try again.' });
  }
});

// Doctor Visit Preparation
app.post('/api/ai/doctor-visit', async (req, res) => {
  try {
    const { entries, medications = [] } = req.body;

    if (!entries || entries.length === 0) {
      return res.status(400).json({ error: 'Entries are required' });
    }

    // Check cache first
    const cacheKey = getCacheKey('doctor-visit', {
      entries: entries.slice(0, 15).map(e => e._id),
      medications: medications.map(m => m._id)
    });
    const cached = getCachedResponse(cacheKey);
    if (cached) {
      return res.json({ ...cached, fromCache: true });
    }

    const recentEntries = entries.slice(0, 15).map(e => {
      const date = new Date(e.createdAt).toLocaleDateString();
      return `${date}: ${e.text}`;
    }).join('\n');

    const medList = medications.length > 0 
      ? medications.map(m => `${m.name} - ${m.dosage}`).join(', ')
      : 'No medications tracked';

    const prompt = `You are helping prepare a concise, professional summary for a doctor's appointment. Focus on key information healthcare providers need to know.

Recent symptoms/activities:
${recentEntries}

Current medications: ${medList}

Format your response using markdown with clear numbered headers:
- Use **bolded numbered headers** for each section (e.g., **1. Brief summary of recent health status:**)
- Use bullet points (*) for lists
- Make it scannable and doctor-friendly

Create these sections:
**1. Brief summary of recent health status:**
(2-3 sentences about overall patterns and main concerns)

**2. Key symptoms or concerns to discuss:**
(bullet list of priority symptoms and issues)

**3. Specific questions to ask the doctor:**
(bullet list of 3-5 focused questions)

**4. Changes or patterns worth mentioning:**
(bullet list of notable trends or developments)

Keep it concise and focused on actionable information healthcare providers need.`;

    const summary = await callGeminiAPI(prompt);

    const response = {
      summary: summary,
      entriesIncluded: Math.min(entries.length, 15),
      medicationsIncluded: medications.length,
      generatedAt: new Date().toISOString()
    };

    // Cache the response
    setCachedResponse(cacheKey, response);

    res.json(response);
    
  } catch (error) {
    console.error('Error preparing doctor visit summary:', error);
    res.status(500).json({ error: error.message || 'Failed to generate doctor visit summary. Please try again.' });
  }
});

// AI Trend Analysis with Graph Data
app.post('/api/ai/trend-analysis', async (req, res) => {
  try {
    const { entries, medications = [] } = req.body;

    if (!entries || entries.length < 3) {
      return res.json({
        message: "Need at least 3 entries to generate trend analysis",
        trendData: [],
        insights: "Not enough data yet. Keep journaling!"
      });
    }

    // Check cache first
    const cacheKey = getCacheKey('trend-analysis', {
      entries: entries.map(e => e._id),
      medications: medications.map(m => m._id)
    });
    const cached = getCachedResponse(cacheKey);
    if (cached) {
      return res.json({ ...cached, fromCache: true });
    }

    // Prepare data for AI analysis
    const entryTexts = entries.map((entry, index) => {
      const date = new Date(entry.createdAt).toLocaleDateString();
      return `${date}: ${entry.text}`;
    }).join('\n');

    const medList = medications.length > 0 
      ? medications.map(m => `${m.name} - ${m.dosage}, ${m.frequency}`).join('; ')
      : 'No medications tracked';

    const prompt = `You are a health data analyst creating insights for visualizing health trends. Analyze these journal entries and provide structured data for graphing.

Journal Entries:
${entryTexts}

Medications: ${medList}

Your task:
1. Analyze the overall mood/symptom trajectory
2. Score each entry from 1-10 (1=worst symptoms, 10=best feeling) based on the language used
3. Identify correlations with medication timing if applicable
4. Provide natural language insights

Respond ONLY with valid JSON in this exact format:
{
  "dailyScores": [
    {"date": "2024-01-01", "score": 7, "summary": "Brief note about this day"},
    {"date": "2024-01-02", "score": 5, "summary": "Brief note about this day"}
  ],
  "trendDirection": "improving" or "declining" or "stable",
  "trendPercentage": 15.5,
  "insights": {
    "overall": "2-3 sentence summary of trend",
    "goodDays": "What characterized better days",
    "challengingDays": "What characterized worse days",
    "recommendations": "Patterns to continue monitoring"
  },
  "correlations": [
    {"factor": "Medication adherence", "impact": "positive" or "negative" or "neutral", "confidence": "high" or "medium" or "low"},
    {"factor": "Sleep quality", "impact": "positive", "confidence": "medium"}
  ]
}

Be precise with the JSON format. No markdown, no extra text, just pure JSON.`;

    const aiResponse = await callGeminiAPI(prompt);
    
    // Parse the AI response - handle potential markdown formatting
    let parsedData;
    try {
      // Remove markdown code blocks if present
      let cleanedResponse = aiResponse.trim();
      if (cleanedResponse.startsWith('```json')) {
        cleanedResponse = cleanedResponse.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
      } else if (cleanedResponse.startsWith('```')) {
        cleanedResponse = cleanedResponse.replace(/```\n?/g, '').replace(/```\n?$/g, '');
      }
      
      parsedData = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiResponse);
      // Fallback: generate basic scores ourselves
      parsedData = {
        dailyScores: entries.map(entry => {
          const text = entry.text.toLowerCase();
          const negativeWords = ['bad', 'worse', 'terrible', 'awful', 'pain', 'flare', 'severe'];
          const positiveWords = ['good', 'better', 'great', 'improving', 'mild'];
          
          let score = 5; // neutral
          negativeWords.forEach(word => {
            if (text.includes(word)) score -= 1;
          });
          positiveWords.forEach(word => {
            if (text.includes(word)) score += 1;
          });
          
          score = Math.max(1, Math.min(10, score));
          
          return {
            date: new Date(entry.createdAt).toLocaleDateString(),
            score: score,
            summary: entry.text.substring(0, 50)
          };
        }),
        trendDirection: "stable",
        trendPercentage: 0,
        insights: {
          overall: "Continue tracking to identify patterns",
          goodDays: "More data needed",
          challengingDays: "More data needed",
          recommendations: "Keep consistent journal entries"
        },
        correlations: []
      };
    }

    const response = {
      ...parsedData,
      entryCount: entries.length,
      medicationCount: medications.length,
      generatedAt: new Date().toISOString()
    };

    // Cache the response
    setCachedResponse(cacheKey, response);

    res.json(response);
    
  } catch (error) {
    console.error('Error generating trend analysis:', error);
    res.status(500).json({ error: error.message || 'Failed to generate trend analysis. Please try again.' });
  }
});

// Temporary: List available models
app.get('/api/test-models', async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler - MUST be last route
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`AI Provider: Google Gemini 1.5 Flash (AI Studio)`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Gemini API Key configured: ${!!process.env.GEMINI_API_KEY}`);
  console.log(`Rate limit: ${DAILY_LIMIT} requests per day`);
});

module.exports = app;