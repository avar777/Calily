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

// GET all entries - only this user's entries
router.get('/entries', async (req, res) => {
  try {
    const entries = await Entry.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .limit(100);
    res.json(entries);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch entries' });
  }
});

// POST new entry - attach userId and handle image
router.post('/entries', async (req, res) => {
  try {
    const { text, image } = req.body;
    
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Entry text is required' });
    }

    const entryData = {
      userId: req.userId,
      text: text.trim()
    };

    // Add image if they uploaded one
    if (image && image.data) {
      // Keep images under 5MB
      const base64Size = image.data.length * 0.75 / 1024 / 1024; // Convert to MB
      if (base64Size > 5) {
        return res.status(400).json({ error: 'Image size must be less than 5MB' });
      }

      entryData.image = {
        data: image.data,
        contentType: image.contentType || 'image/jpeg',
        filename: image.filename || 'photo.jpg'
      };
    }

    const entry = new Entry(entryData);
    const savedEntry = await entry.save();
    res.status(201).json(savedEntry);
  } catch (error) {
    console.error('Error creating entry:', error);
    res.status(500).json({ error: 'Failed to create entry' });
  }
});

// GET single entry by ID
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

// PUT update existing entry
router.put('/entries/:id', async (req, res) => {
  try {
    const { text, image, removeImage } = req.body;
    
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Entry text is required' });
    }

    const updateData = { text: text.trim() };

    // Remove image if they want to
    if (removeImage) {
      updateData.image = undefined;
    }
    // Or update/add a new image
    else if (image && image.data) {
      const base64Size = image.data.length * 0.75 / 1024 / 1024;
      if (base64Size > 5) {
        return res.status(400).json({ error: 'Image size must be less than 5MB' });
      }

      updateData.image = {
        data: image.data,
        contentType: image.contentType || 'image/jpeg',
        filename: image.filename || 'photo.jpg'
      };
    }

    const entry = await Entry.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!entry) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    res.json(entry);
  } catch (error) {
    console.error('Error updating entry:', error);
    res.status(500).json({ error: 'Failed to update entry' });
  }
});

// DELETE entry by ID
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

// GET search entries by text/tags (user-specific)
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || !q.trim()) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    // Only search this user's entries
    const entries = await Entry.searchEntries(q.trim(), req.userId);
    res.json(entries);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Failed to search entries' });
  }
});

// GET symptom frequency data for the chart
router.get('/stats', async (req, res) => {
  try {
    // Use MongoDB aggregation to count tag frequency
    const tagAggregation = await Entry.aggregate([
      { $unwind: '$tags' }, // Split out each tag
      { $group: { _id: '$tags', count: { $sum: 1 } } }, // Count 'em
      { $sort: { count: -1 } }, // Sort by most common
      { $limit: 10 } // Top 10 only
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

// GET recent entries
router.get('/recent', async (req, res) => {
  try {
    const entries = await Entry.find().sort({ createdAt: -1 }).limit(5);
    res.json(entries);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch recent entries' });
  }
});

// GET export all entries as text
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