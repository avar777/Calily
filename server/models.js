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
    'dizzy', 'tired', 'fatigue', 'pain', 'headache', 'nausea', 
    'walking', 'running', 'exercise', 'sleep', 'stress', 'anxious',
    'bloated', 'cramping', 'fever', 'cold', 'flu', 'medication',
    'better', 'worse', 'good', 'bad', 'energy', 'mood'
  ];
  
  const textLower = this.text.toLowerCase();
  this.tags = healthKeywords.filter(keyword => textLower.includes(keyword));
  
  next();
});

entrySchema.methods.getFormattedDate = function() {
  return this.createdAt.toLocaleDateString() + ' ' + 
         this.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

entrySchema.statics.searchEntries = function(searchTerm) {
  const regex = new RegExp(searchTerm, 'i');
  return this.find({
    $or: [
      { text: regex },
      { tags: { $in: [regex] } }
    ]
  }).sort({ createdAt: -1 });
};

entrySchema.statics.getEntriesByDateRange = function(startDate, endDate) {
  return this.find({
    createdAt: {
      $gte: startDate,
      $lte: endDate
    }
  }).sort({ createdAt: -1 });
};

const Entry = mongoose.model('Entry', entrySchema);

module.exports = { Entry };