/*
 * Calily
 * Mongoose definition with tagging and search
 *
 * Author: Ava Raper
 * Version: 1.0
 */

const mongoose = require('mongoose');

// User Schema
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
  resetPasswordToken: {
    type: String
  },
  resetPasswordExpires: {
    type: Date
  },
  lastLogin: {
    type: Date
  },
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const User = mongoose.model('User', userSchema);

// Entry Schema with userId and validation
const entrySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  text: {
    type: String,
    required: [true, 'Entry text is required'],
    trim: true,
    maxlength: [1000, 'Entry cannot exceed 1000 characters']
  },
  image: {
    data: String,  // Base64 encoded image data
    contentType: String,  // Image MIME type (e.g., 'image/jpeg', 'image/png')
    filename: String  // Original filename
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

entrySchema.index({ text: 'text' }); // full-text search 
entrySchema.index({ createdAt: -1 }); // sort by date
entrySchema.index({ userId: 1, createdAt: -1 }); // user entries sorted by date

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
entrySchema.statics.searchEntries = function(searchTerm, userId) {
  const regex = new RegExp(searchTerm, 'i'); // case insensitive search 
  return this.find({
    userId: userId,  // Only search user's own entries
    $or: [
      { text: regex }, // search in entry text
      { tags: { $in: [regex] } } // search in tags 
    ]
  }).sort({ createdAt: -1 }); // sort by newest to last
};

const Entry = mongoose.model('Entry', entrySchema);

// Medication Schema
const medicationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Medication name is required'],
    trim: true
  },
  dosage: {
    type: String,
    required: [true, 'Dosage is required'],
    trim: true
  },
  frequency: {
    type: String,
    enum: ['Daily', 'Twice Daily', 'Three Times Daily', 'As Needed', 'Weekly'],
    default: 'Daily'
  },
  timeOfDay: {
    type: String,
    enum: ['Morning', 'Afternoon', 'Evening', 'Bedtime', 'With Meals'],
    default: 'Morning'
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [200, 'Notes cannot exceed 200 characters']
  },
  trackOnly: {
    type: Boolean,
    default: false  // false = show checkboxes, true = just list the med
  },
  takenDoses: [{
    type: String  // Store as 'YYYY-MM-DD-Morning', 'YYYY-MM-DD-Evening', etc.
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

medicationSchema.index({ userId: 1, createdAt: -1 }); // user medications sorted by date

medicationSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const Medication = mongoose.model('Medication', medicationSchema);

module.exports = { Entry, User, Medication };