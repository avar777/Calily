/*
 * Calily
 * Mongoose schemas with tagging and search
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
    data: String,  // Base64 encoded image
    contentType: String,  // image/jpeg, image/png, etc.
    filename: String
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

// Set up indexes for better performance
entrySchema.index({ text: 'text' }); // full-text search 
entrySchema.index({ createdAt: -1 }); // sort by date
entrySchema.index({ userId: 1, createdAt: -1 }); // user entries sorted by date

// Auto-tag entries with health keywords before saving
entrySchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Health keyword list for auto-tagging
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
  
  // Find keywords in the entry text
  const textLower = this.text.toLowerCase();
  this.tags = healthKeywords.filter(keyword => textLower.includes(keyword));
  next();
});

// Search across text and tags (user-specific)
entrySchema.statics.searchEntries = function(searchTerm, userId) {
  const regex = new RegExp(searchTerm, 'i'); // case insensitive
  return this.find({
    userId: userId,  // Only search this user's entries
    $or: [
      { text: regex }, // search in text
      { tags: { $in: [regex] } } // search in tags 
    ]
  }).sort({ createdAt: -1 }); // newest first
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
    default: false  // false = show checkboxes, true = just list it
  },
  takenDoses: [{
    type: String  // Format: 'YYYY-MM-DD-Morning', 'YYYY-MM-DD-Evening', etc.
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

// Index for better performance
medicationSchema.index({ userId: 1, createdAt: -1 });

medicationSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const Medication = mongoose.model('Medication', medicationSchema);

module.exports = { Entry, User, Medication };