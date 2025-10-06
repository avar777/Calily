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
        'https://calily-ihr63wim8-avar777s-projects.vercel.app',  // Add this
        'https://calily.vercel.app',
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
// Generate weekly summary from recent entries
app.post('/api/ai/weekly-summary', async (req, res) => {
  try {
    const { userId } = req.body;

    // Get entries from last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const entries = await Entry.find({
      userId: userId,
      createdAt: { $gte: sevenDaysAgo }
    }).sort({ createdAt: -1 });

    const summary = await aiServiceBackend.generateWeeklySummary(entries);

    res.json(summary);
  } catch (error) {
    console.error('Error generating weekly summary:', error);
    res.status(500).json({ error: 'Failed to generate summary' });
  }
});

// POST /api/ai/analyze-patterns
// Analyze health patterns from all entries
app.post('/api/ai/analyze-patterns', async (req, res) => {
  try {
    const { userId } = req.body;

    // Get all entries for the user
    const entries = await Entry.find({ userId: userId })
      .sort({ createdAt: -1 })
      .limit(50);

    const analysis = await aiServiceBackend.analyzePatterns(entries);

    res.json(analysis);
  } catch (error) {
    console.error('Error analyzing patterns:', error);
    res.status(500).json({ error: 'Failed to analyze patterns' });
  }
});

// POST /api/ai/identify-triggers
// Identify potential health triggers
app.post('/api/ai/identify-triggers', async (req, res) => {
  try {
    const { userId } = req.body;

    // Get recent entries
    const entries = await Entry.find({ userId: userId })
      .sort({ createdAt: -1 })
      .limit(50);

    const triggers = await aiServiceBackend.identifyTriggers(entries);

    res.json(triggers);
  } catch (error) {
    console.error('Error identifying triggers:', error);
    res.status(500).json({ error: 'Failed to identify triggers' });
  }
});

// POST /api/ai/ask-question
// Answer natural language questions about health data
app.post('/api/ai/ask-question', async (req, res) => {
  try {
    const { userId, question } = req.body;

    if (!question || question.trim() === '') {
      return res.status(400).json({ error: 'Question is required' });
    }

    // Get recent entries for context
    const entries = await Entry.find({ userId: userId })
      .sort({ createdAt: -1 })
      .limit(20);

    const recentEntries = entries.map(e => {
      const date = new Date(e.createdAt).toLocaleDateString();
      return `${date}: ${e.text}`;
    }).join('\n');

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You answer questions about a user\'s health journal. Use their data to provide specific answers. Never diagnose or provide medical advice.'
        },
        {
          role: 'user',
          content: `Question: "${question}"\n\nRecent entries:\n${recentEntries}`
        }
      ],
      max_tokens: 300,
      temperature: 0.7
    });

    res.json({
      question: question,
      answer: completion.choices[0].message.content,
      entriesReferenced: entries.length,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error answering question:', error);
    res.status(500).json({ error: 'Failed to answer question' });
  }
});

// POST /api/ai/doctor-prep
// Generate doctor visit preparation summary
app.post('/api/ai/doctor-prep', async (req, res) => {
  try {
    const { userId } = req.body;

    // Get recent entries (last 2 weeks)
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    const entries = await Entry.find({
      userId: userId,
      createdAt: { $gte: twoWeeksAgo }
    }).sort({ createdAt: -1 }).limit(15);

    const recentEntries = entries.map(e => {
      const date = new Date(e.createdAt).toLocaleDateString();
      return `${date}: ${e.text}`;
    }).join('\n');

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You help prepare concise, professional summaries for doctor appointments. Focus on key information healthcare providers need.'
        },
        {
          role: 'user',
          content: `Prepare a doctor visit summary from these entries:\n\n${recentEntries}\n\nInclude: brief status, key symptoms, questions for doctor.`
        }
      ],
      max_tokens: 500,
      temperature: 0.6
    });

    res.json({
      summary: completion.choices[0].message.content,
      entriesIncluded: entries.length,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error preparing doctor visit summary:', error);
    res.status(500).json({ error: 'Failed to generate summary' });
  }
});

module.exports = { aiServiceBackend };