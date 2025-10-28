/*
 * Calily
 * Express server setup with MongoDB connection and middleware
 * Configured for Render deployment
 */
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const routes = require('./routes');
require('dotenv').config();
const OpenAI = require('openai');
const authRoutes = require('./authRoutes');
const authMiddleware = require('./authMiddleware');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const app = express();
const PORT = process.env.PORT || 5001;

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/calily';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB Atlas'))
.catch(err => console.error('MongoDB connection error:', err));

// CORS configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? [
        'https://avar777.github.io',
        'https://avar777.github.io/calily',
        'https://calily-ihr63wim8-avar777s-projects.vercel.app',
        'https://calily-1hvcz5hdc-avar777s-projects.vercel.app',
        'https://calily.vercel.app',
        'http://localhost:3000',
        /https:\/\/calily.*\.vercel\.app$/,
        process.env.FRONTEND_URL
      ]
    : ['http://localhost:3000'],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/api/auth', authRoutes);
// Protect existing routes with auth middleware
app.use('/api/entries', authMiddleware);  // Add this line
app.use('/api', authMiddleware);  // Protect all API routes

// Health check endpoints
app.get('/', (req, res) => {
  res.json({ 
    status: 'Calily API is running', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV 
  });
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Regular API routes
app.use('/api', routes);

// AI Service Backend
const aiServiceBackend = {
  async generateWeeklySummary(entries) {
    if (!entries || entries.length === 0) {
      return {
        summary: "No entries logged this week.",
        entryCount: 0
      };
    }

    const entryTexts = entries.map((entry, index) => {
      const date = new Date(entry.createdAt).toLocaleDateString();
      return `Day ${index + 1} (${date}): ${entry.text}`;
    }).join('\n');

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a compassionate health data analyst who helps people with chronic illnesses understand their health patterns. You provide observations, not medical advice.'
        },
        {
          role: 'user',
          content: `Analyze these journal entries and provide a brief, supportive summary:\n\n${entryTexts}`
        }
      ],
      max_tokens: 500,
      temperature: 0.7
    });

    return {
      summary: completion.choices[0].message.content,
      entryCount: entries.length,
      generatedAt: new Date().toISOString()
    };
  },

  async analyzePatterns(entries) {
    if (!entries || entries.length < 5) {
      return {
        patterns: [],
        message: "Need at least 5 entries to identify patterns."
      };
    }

    const entryTexts = entries.slice(0, 30).map(e => {
      const date = new Date(e.createdAt).toLocaleDateString();
      return `${date}: ${e.text}`;
    }).join('\n');

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a health pattern analyst. Identify patterns in health data. Never diagnose. Only observe and suggest questions for healthcare providers.'
        },
        {
          role: 'user',
          content: `Identify health patterns in these entries:\n\n${entryTexts}\n\nProvide: top symptoms, patterns, correlations, questions for doctor.`
        }
      ],
      max_tokens: 600,
      temperature: 0.6
    });

    return {
      patterns: completion.choices[0].message.content,
      entriesAnalyzed: Math.min(entries.length, 30),
      totalEntries: entries.length,
      generatedAt: new Date().toISOString()
    };
  },

  async identifyTriggers(entries) {
    if (!entries || entries.length < 10) {
      return {
        triggers: [],
        message: "Need at least 10 entries to identify triggers."
      };
    }

    const severeEntries = entries.filter(e => 
      e.text.toLowerCase().includes('flare') || 
      e.text.toLowerCase().includes('bad') || 
      e.text.toLowerCase().includes('severe')
    );

    const mildEntries = entries.filter(e => 
      e.text.toLowerCase().includes('better') || 
      e.text.toLowerCase().includes('good')
    );

    const severeTexts = severeEntries.slice(0, 10).map(e => e.text).join('\n');
    const mildTexts = mildEntries.slice(0, 10).map(e => e.text).join('\n');

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You identify potential correlations and triggers in symptom patterns. Be cautious and emphasize correlation, not causation.'
        },
        {
          role: 'user',
          content: `Identify potential triggers:\n\nWorse days:\n${severeTexts}\n\nBetter days:\n${mildTexts}`
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
  }
};

// AI Routes - MUST come before error handlers
app.post('/api/ai/weekly-summary', async (req, res) => {
  try {
    const { entries } = req.body;

    if (!entries || entries.length === 0) {
      return res.json({
        summary: "No entries logged this week.",
        entryCount: 0
      });
    }

    const summary = await aiServiceBackend.generateWeeklySummary(entries);
    res.json(summary);
    
  } catch (error) {
    console.error('Error generating weekly summary:', error);
    res.status(500).json({ error: 'Failed to generate summary' });
  }
});

app.post('/api/ai/analyze-patterns', async (req, res) => {
  try {
    const { entries } = req.body;

    if (!entries || entries.length < 5) {
      return res.json({
        patterns: [],
        message: "Need at least 5 entries to identify patterns."
      });
    }

    const analysis = await aiServiceBackend.analyzePatterns(entries);
    res.json(analysis);
    
  } catch (error) {
    console.error('Error analyzing patterns:', error);
    res.status(500).json({ error: 'Failed to analyze patterns' });
  }
});

app.post('/api/ai/identify-triggers', async (req, res) => {
  try {
    const { entries } = req.body;

    if (!entries || entries.length < 10) {
      return res.json({
        triggers: [],
        message: "Need at least 10 entries to identify triggers."
      });
    }

    const triggers = await aiServiceBackend.identifyTriggers(entries);
    res.json(triggers);
    
  } catch (error) {
    console.error('Error identifying triggers:', error);
    res.status(500).json({ error: 'Failed to identify triggers' });
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

// Start server - MUST be at the very end
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
});

module.exports = { aiServiceBackend };