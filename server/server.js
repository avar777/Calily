const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

let entries = [];
let nextId = 1;

const createEntry = (text) => ({
  _id: nextId++,
  text: text.trim(),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
});

app.get('/api/entries', (req, res) => {
  res.json(entries.slice().reverse());
});

app.post('/api/entries', (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Entry text is required' });
    }

    const entry = createEntry(text);
    entries.push(entry);
    
    res.status(201).json(entry);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create entry' });
  }
});

app.get('/api/entries/search', (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || !q.trim()) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const searchTerm = q.trim().toLowerCase();
    const results = entries.filter(entry => 
      entry.text.toLowerCase().includes(searchTerm)
    ).reverse();
    
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: 'Failed to search entries' });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});