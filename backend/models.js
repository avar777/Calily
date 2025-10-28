/*
 * Calily
 * Mongoose definition with tagging and search
 *
 * Author: Ava Raper
 * Version: 1.0
 */

const mongoose = require('mongoose');

// This will define entry schema with validation and constraints
const entrySchema = new mongoose.Schema({
  text: {
    type: String,
    required: [true, 'Entry text is required'],
    trim: true,
    maxlength: [1000, 'Entry cannot exceed 1000 characters']
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

entrySchema.index({ text: 'text' }); // full-tect search 
entrySchema.index({ createdAt: -1 }); // sort by date

// tagging system for health keywords
entrySchema.pre('save', function(next) {
  this.updatedAt = new Date();
  const healthKeywords = [
    'fatigue', 'tired', 'exhausted', 'weak', 'weakness', 'energy', 'drained',
    'pain', 'ache', 'aches', 'sore', 'tender', 'burning', 'sharp pain', 'throbbing',
    'joint pain', 'back pain', 'neck pain', 'muscle aches', 'muscle pain', 'stiffness',
    'headache', 'migraine', 'dizzy', 'dizziness', 'lightheaded', 'vertigo',
    'nausea', 'sick', 'queasy', 'vomiting', 'threw up', 'stomach ache',
    'bloating', 'bloated', 'cramping', 'cramps', 'digestive', 'bowel',
    'fever', 'hot', 'chills', 'cold', 'shivering', 'sweating', 'night sweats',
    'swelling', 'swollen', 'inflammation', 'puffy', 'fluid retention',
    'rash', 'itchy', 'itching', 'skin problems', 'dry skin', 'flare',
    'shortness of breath', 'breathing', 'chest pain', 'chest tight',
    'numbness', 'tingling', 'pins and needles', 'burning sensation',
    'heartrate', 'heart racing', 'palpitations', 'irregular heartbeat', 
    'anxious', 'anxiety', 'worried', 'stress', 'stressed', 'overwhelmed',
    'sad', 'depressed', 'down', 'emotional', 'crying', 'moody', 'irritable',
    'brain fog', 'confused', 'forgetful', 'concentration', 'focus',
    'restless', 'agitated', 'frustrated', 'angry', 'mood swings',
    'walking', 'running', 'exercise', 'workout', 'gym', 'yoga', 'stretching',
    'work', 'working', 'sitting', 'standing', 'driving', 'commute',
    'sleep', 'sleeping', 'nap', 'rest', 'bed', 'insomnia', 'woke up',
    'eating', 'meal', 'breakfast', 'lunch', 'dinner', 'cooking', 'food',
    'medication', 'pills', 'treatment', 'doctor', 'appointment',
    'weather', 'rain', 'cold weather', 'hot weather', 'humidity',
    'family', 'friends', 'social', 'alone', 'busy', 'relaxing'
  ];
  // search entry text for health keywords
  const textLower = this.text.toLowerCase();
  this.tags = healthKeywords.filter(keyword => textLower.includes(keyword));
  next();
});

// advance search across text and tags
entrySchema.statics.searchEntries = function(searchTerm) {
  const regex = new RegExp(searchTerm, 'i'); // case search 
  return this.find({
    $or: [
      { text: regex }, // search in entry text
      { tags: { $in: [regex] } } // search in tags 
    ]
  }).sort({ createdAt: -1 }); // sort by newest to last
};

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const User = mongoose.model('User', userSchema);

// Update Entry schema to include userId
const entrySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true  // Add this
  },
  text: {
    type: String,
    required: true
  },
  tags: [String],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Entry = mongoose.model('Entry', entrySchema);
module.exports = { Entry, User };