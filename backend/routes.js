/*
 * Calily
 * API routes for entry management and data operations
 *
 * Author: Ava Raper
 * Version: 1.0
 */
const express = require('express');
const router = express.Router();
const { Entry } = require('./models');

// this will get - all entries periodical
router.get('/entries', async (req, res) => {
  try {
    const entries = await Entry.find().sort({ createdAt: -1 }).limit(100);
    res.json(entries);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch entries' });
  }
});

// this will post - creates new entry with validation
router.post('/entries', async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Entry text is required' }); // triggers tagging 
    }

    const entry = new Entry({
      text: text.trim()
    });

    const savedEntry = await entry.save();
    res.status(201).json(savedEntry);
  } catch (error) {
      res.status(500).json({ error: 'Failed to create entry' });    
  }
});

// this will get - single entry by ID
router.get('/entries/:id', async (req, res) => {
  try {
    const entry = await Entry.findById(req.params.id);
    
    if (!entry) {
      return res.status(404).json({ error: 'Entry not found' });
    }
    
    res.json(entry);
  } catch (error) {
      res.status(500).json({ error: 'Failed to fetch entry' });
  }
});

// this will put - update existing entry
router.put('/entries/:id', async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Entry text is required' });
    }

    const entry = await Entry.findByIdAndUpdate(
      req.params.id,
      { text: text.trim() },
      { new: true, runValidators: true }
    );

    if (!entry) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    res.json(entry);
  } catch (error) {
      res.status(500).json({ error: 'Failed to update entry' });
  }
});

// this will delete - entry by ID
router.delete('/entries/:id', async (req, res) => {
  try {
    const entry = await Entry.findByIdAndDelete(req.params.id);
    
    if (!entry) {
      return res.status(404).json({ error: 'Entry not found' });
    }
    
    res.json({ message: 'Entry deleted successfully' });
  } catch (error) {
      res.status(500).json({ error: 'Failed to delete entry' });
  }
});

// this will get - search entries by text/tags
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || !q.trim()) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const entries = await Entry.searchEntries(q.trim()); // use made static method
    res.json(entries);
  } catch (error) {
    res.status(500).json({ error: 'Failed to search entries' });
  }
});

// this will get - symptom frequency data for bar chart
router.get('/stats', async (req, res) => {
  try {
    // use mongoDB for frequency analysis
    const tagAggregation = await Entry.aggregate([
      { $unwind: '$tags' }, // seperate each tag
      { $group: { _id: '$tags', count: { $sum: 1 } } }, // count 
      { $sort: { count: -1 } }, // sort 
      { $limit: 10 } // top 10 
    ]);
    const chartData = tagAggregation.map(item => ({
      symptom: item._id,
      count: item.count
    }));
    res.json({ chartData });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// this will get- the recent entries
router.get('/recent', async (req, res) => {
  try {
    const entries = await Entry.find().sort({ createdAt: -1 }).limit(5);
    res.json(entries);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch recent entries' });
  }
});

// this will get - to export all entries as .txt
router.get('/export', async (req, res) => {
  try {
    const entries = await Entry.find().sort({ createdAt: -1 });
    let exportText = entries.map(entry => 
      `${entry.createdAt.toLocaleDateString()}: ${entry.text}`
    ).join('\n\n');
    res.json({ exportText });
  } catch (error) {
    res.status(500).json({ error: 'Failed to export entries' });
  }
});

module.exports = router;