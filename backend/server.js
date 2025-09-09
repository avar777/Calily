/*
 * Calily
 * Express server setup with MongoDB connection and middleware
 * Configured for Render deployment
 */
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const routes = require('./routes');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 10000; // Render uses port 10000

// MongoDB connection with your Atlas database
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/calily';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB Atlas'))
.catch(err => console.error('MongoDB connection error:', err));

// CORS configuration for production
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? [
        'https://avar777.github.io',
        'https://avar777.github.io/calily',
        process.env.FRONTEND_URL
      ]
    : ['http://localhost:3000'],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    status: 'Calily API is running', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV 
  });
});

app.use('/api', routes);

app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
});

module.exports = app;