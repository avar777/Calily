const express = require('express');
const router = express.Router();
const { Entry } = require('./models');

// GET /api/entries - Get all entries
router.get('/entries', async (req, res) => {
  try {
    const entries = await Entry.find()
      .sort({ createdAt: -1 })
      .limit(100); // Limit to last 100 entries for performance
    
    res.json(entries);
  } catch (error) {
    console.error('Error fetching entries:', error);
    res.status(500).json({ error: 'Failed to fetch entries' });
  }
});

// POST /api/entries - Create new entry
router.post('/entries', async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Entry text is required' });
    }

    const entry = new Entry({
      text: text.trim()
    });

    const savedEntry = await entry.save();
    res.status(201).json(savedEntry);
  } catch (error) {
    console.error('Error creating entry:', error);
    if (error.name === 'ValidationError') {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to create entry' });
    }
  }
});

// GET /api/entries/:id - Get single entry
router.get('/entries/:id', async (req, res) => {
  try {
    const entry = await Entry.findById(req.params.id);
    
    if (!entry) {
      return res.status(404).json({ error: 'Entry not found' });
    }
    
    res.json(entry);
  } catch (error) {
    console.error('Error fetching entry:', error);
    if (error.name === 'CastError') {
      res.status(400).json({ error: 'Invalid entry ID' });
    } else {
      res.status(500).json({ error: 'Failed to fetch entry' });
    }
  }
});

// PUT /api/entries/:id - Update entry
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
    console.error('Error updating entry:', error);
    if (error.name === 'ValidationError') {
      res.status(400).json({ error: error.message });
    } else if (error.name === 'CastError') {
      res.status(400).json({ error: 'Invalid entry ID' });
    } else {
      res.status(500).json({ error: 'Failed to update entry' });
    }
  }
});

// DELETE /api/entries/:id - Delete entry
router.delete('/entries/:id', async (req, res) => {
  try {
    const entry = await Entry.findByIdAndDelete(req.params.id);
    
    if (!entry) {
      return res.status(404).json({ error: 'Entry not found' });
    }
    
    res.json({ message: 'Entry deleted successfully' });
  } catch (error) {
    console.error('Error deleting entry:', error);
    if (error.name === 'CastError') {
      res.status(400).json({ error: 'Invalid entry ID' });
    } else {
      res.status(500).json({ error: 'Failed to delete entry' });
    }
  }
});

router.get('/entries/search', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || !q.trim()) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const entries = await Entry.searchEntries(q.trim());
    res.json(entries);
  } catch (error) {
    console.error('Error searching entries:', error);
    res.status(500).json({ error: 'Failed to search entries' });
  }
});

router.get('/stats', async (req, res) => {
  try {
    const totalEntries = await Entry.countDocuments();
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEntries = await Entry.countDocuments({
      createdAt: { $gte: startOfToday }
    });

    const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const weekEntries = await Entry.countDocuments({
      createdAt: { $gte: lastWeek }
    });

    const tagAggregation = await Entry.aggregate([
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      totalEntries,
      todayEntries,
      weekEntries,
      commonTags: tagAggregation
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

router.get('/entries/export', async (req, res) => {
  try {
    const entries = await Entry.find().sort({ createdAt: -1 });
    
    res.json({
      exportDate: new Date().toISOString(),
      totalEntries: entries.length,
      entries: entries
    });
  } catch (error) {
    console.error('Error exporting entries:', error);
    res.status(500).json({ error: 'Failed to export entries' });
  }
});

module.exports = router;