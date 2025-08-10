const mongoose = require('mongoose');

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

entrySchema.index({ text: 'text' });
entrySchema.index({ createdAt: -1 });

entrySchema.pre('save', function(next) {
  this.updatedAt = new Date();
  const healthKeywords = [
    // Physical symptoms
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
  const textLower = this.text.toLowerCase();
  this.tags = healthKeywords.filter(keyword => textLower.includes(keyword));
  next();
});

entrySchema.statics.searchEntries = function(searchTerm) {
  const regex = new RegExp(searchTerm, 'i');
  return this.find({
    $or: [
      { text: regex },
      { tags: { $in: [regex] } }
    ]
  }).sort({ createdAt: -1 });
};

const Entry = mongoose.model('Entry', entrySchema);
module.exports = { Entry };