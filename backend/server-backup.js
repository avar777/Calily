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

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/calily';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? [process.env.FRONTEND_URL, 'http://localhost:3000']
    : ['http://localhost:3000'],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/api/auth', authRoutes);
app.use('/api/entries', authMiddleware);
app.use('/api', authMiddleware);

app.get('/', (req, res) => {
  res.json({ 
    status: 'Calily API is running', 
    timestamp: new Date().toISOString(),
    ai: 'OpenAI GPT-3.5-turbo'
  });
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    ai: 'OpenAI'
  });
});

app.use('/api', routes);

// AI Routes
app.post('/api/ai/weekly-summary', async (req, res) => {
  try {
    const { entries } = req.body;
    if (!entries || entries.length === 0) {
      return res.json({ summary: "No entries logged this week.", entryCount: 0 });
    }

    const entryTexts = entries.map(e => {
      const date = new Date(e.createdAt).toLocaleDateString();
      return `${date}: ${e.text}`;
    }).join('\n');

    const sortedEntries = [...entries].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    const startDate = new Date(sortedEntries[0].createdAt).toLocaleDateString();
    const endDate = new Date(sortedEntries[sortedEntries.length - 1].createdAt).toLocaleDateString();

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{
        role: 'system',
        content: 'You are a compassionate health analyst. Provide brief, supportive summaries of health journal entries. Focus on observations only, not medical advice.'
      }, {
        role: 'user',
        content: `Analyze these journal entries from ${startDate} to ${endDate}:\n\n${entryTexts}\n\nProvide a brief summary (4-5 sentences): overall week, common symptoms, patterns, encouraging note.`
      }],
      max_tokens: 300,
      temperature: 0.7
    });

    res.json({
      summary: completion.choices[0].message.content,
      entryCount: entries.length,
      dateRange: { start: startDate, end: endDate },
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error generating summary:', error);
    res.status(500).json({ error: 'Failed to generate summary' });
  }
});

app.post('/api/ai/analyze-patterns', async (req, res) => {
  try {
    const { entries } = req.body;
    if (!entries || entries.length < 5) {
      return res.json({ patterns: [], message: "Need at least 5 entries to identify patterns." });
    }

    const recentEntries = entries.slice(0, 30);
    const entryTexts = recentEntries.map(e => {
      const date = new Date(e.createdAt).toLocaleDateString();
      return `${date}: ${e.text}`;
    }).join('\n');

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{
        role: 'system',
        content: 'You are a health pattern analyst. Identify patterns in health data. Never diagnose. Only observe and suggest questions for healthcare providers.'
      }, {
        role: 'user',
        content: `Analyze these ${recentEntries.length} entries:\n\n${entryTexts}\n\nIdentify: top symptoms, patterns, correlations, questions for doctor.`
      }],
      max_tokens: 400,
      temperature: 0.6
    });

    res.json({
      patterns: completion.choices[0].message.content,
      entriesAnalyzed: recentEntries.length,
      totalEntries: entries.length,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error analyzing patterns:', error);
    res.status(500).json({ error: 'Failed to analyze patterns' });
  }
});

app.post('/api/ai/identify-triggers', async (req, res) => {
  try {
    const { entries } = req.body;
    if (!entries || entries.length < 10) {
      return res.json({ triggers: [], message: "Need at least 10 entries to identify triggers." });
    }

    const severeEntries = entries.filter(e => 
      e.text.toLowerCase().includes('flare') || e.text.toLowerCase().includes('bad') || e.text.toLowerCase().includes('severe')
    );
    const mildEntries = entries.filter(e => 
      e.text.toLowerCase().includes('better') || e.text.toLowerCase().includes('good')
    );

    const severeTexts = severeEntries.slice(0, 10).map(e => `- ${e.text}`).join('\n');
    const mildTexts = mildEntries.slice(0, 10).map(e => `- ${e.text}`).join('\n');

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{
        role: 'system',
        content: 'You identify potential correlations in symptom patterns. Be cautious and emphasize correlation, not causation.'
      }, {
        role: 'user',
        content: `Identify triggers:\n\nWORSE DAYS:\n${severeTexts || 'Limited data'}\n\nBETTER DAYS:\n${mildTexts || 'Limited data'}\n\nIdentify: potential triggers, better day factors, patterns to monitor.`
      }],
      max_tokens: 300,
      temperature: 0.6
    });

    res.json({
      triggers: completion.choices[0].message.content,
      severeEntryCount: severeEntries.length,
      mildEntryCount: mildEntries.length,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error identifying triggers:', error);
    res.status(500).json({ error: 'Failed to identify triggers' });
  }
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`AI Provider: OpenAI GPT-3.5-turbo`);
});
