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

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const app = express();
const PORT = process.env.PORT || 10000; // Render uses port 10000

// MongoDB connection with your Atlas database
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/calily';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB Atlas'))
.catch(err => console.error('MongoDB connection error:', err));

// CORS configuration for production
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? [
        'https://avar777.github.io',
        'https://avar777.github.io/calily',
        'https://calily-ihr63wim8-avar777s-projects.vercel.app',
        'https://calily-1hvcz5hdc-avar777s-projects.vercel.app',  // Add new URL
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

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    status: 'Calily API is running', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV 
  });
});

app.use('/api', routes);

app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
});

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
      model: 'gpt-4',
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

// POST /api/ai/weekly-summary
// Generate weekly summary from entries sent from frontend
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

// POST /api/ai/analyze-patterns
// Analyze health patterns from entries sent from frontend
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

// POST /api/ai/identify-triggers
// Identify potential health triggers from entries sent from frontend
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

module.exports = { aiServiceBackend };