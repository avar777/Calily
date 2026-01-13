/*
 * Calily - Medication Routes
 * Backend API routes for medication tracking
 * 
 * Author: Ava Raper
 * Version: 2.0 - Added toggle-dose endpoint for multiple doses per day
 */
const express = require('express');
const router = express.Router();
const { Medication } = require('./models');

// GET all medications for this user
router.get('/medications', async (req, res) => {
  try {
    const medications = await Medication.find({ userId: req.user._id })
      .sort({ createdAt: -1 });
    res.json(medications);
  } catch (error) {
    console.error('Error fetching medications:', error);
    res.status(500).json({ error: 'Failed to fetch medications' });
  }
});

// POST create new medication
router.post('/medications', async (req, res) => {
  try {
    const { name, dosage, frequency, timeOfDay, notes, trackOnly } = req.body;

    if (!name || !dosage) {
      return res.status(400).json({ error: 'Name and dosage are required' });
    }

    const medication = new Medication({
      userId: req.user._id,
      name: name.trim(),
      dosage: dosage.trim(),
      frequency: frequency || 'Daily',
      timeOfDay: timeOfDay || 'Morning',
      notes: notes?.trim() || '',
      trackOnly: trackOnly || false,
      takenDoses: []  // Start with empty array
    });

    await medication.save();
    res.status(201).json(medication);
  } catch (error) {
    console.error('Error creating medication:', error);
    res.status(500).json({ error: 'Failed to create medication' });
  }
});

// PUT toggle specific dose (supports multiple doses per day)
router.put('/medications/:id/toggle-dose', async (req, res) => {
  try {
    const { doseKey, taken } = req.body;
    
    const medication = await Medication.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!medication) {
      return res.status(404).json({ error: 'Medication not found' });
    }

    // Make sure takenDoses array exists
    if (!medication.takenDoses) {
      medication.takenDoses = [];
    }

    if (taken) {
      // Add this dose if it's not already there
      if (!medication.takenDoses.includes(doseKey)) {
        medication.takenDoses.push(doseKey);
      }
    } else {
      // Remove this dose
      medication.takenDoses = medication.takenDoses.filter(d => d !== doseKey);
    }

    await medication.save();
    res.json(medication);
  } catch (error) {
    console.error('Error toggling dose:', error);
    res.status(500).json({ error: 'Failed to update medication dose' });
  }
});

// PUT toggle medication for a date (old endpoint - kept for backwards compatibility)
router.put('/medications/:id/toggle', async (req, res) => {
  try {
    const { date, taken } = req.body;
    
    const medication = await Medication.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!medication) {
      return res.status(404).json({ error: 'Medication not found' });
    }

    // Make sure takenDates exists (for backwards compatibility)
    if (!medication.takenDates) {
      medication.takenDates = [];
    }

    if (taken) {
      if (!medication.takenDates.includes(date)) {
        medication.takenDates.push(date);
      }
    } else {
      medication.takenDates = medication.takenDates.filter(d => d !== date);
    }

    await medication.save();
    res.json(medication);
  } catch (error) {
    console.error('Error toggling medication:', error);
    res.status(500).json({ error: 'Failed to update medication' });
  }
});

// DELETE medication
router.delete('/medications/:id', async (req, res) => {
  try {
    const medication = await Medication.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!medication) {
      return res.status(404).json({ error: 'Medication not found' });
    }

    res.json({ message: 'Medication deleted successfully' });
  } catch (error) {
    console.error('Error deleting medication:', error);
    res.status(500).json({ error: 'Failed to delete medication' });
  }
});

module.exports = router;