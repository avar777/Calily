/*
 * Calily
 * Express server setup with MongoDB connection and middleware
 *
 * Author: Ava Raper
 * Version: 1.0
 */
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const routes = require('./routes');

const app = express();
const PORT = process.env.PORT || 5001;

// connect to MongoDB database
mongoose.connect('mongodb://localhost:27017/calily');

// middleware setup
app.use(cors()); // enable cross-origin request
app.use(express.json()); // parse JSON

app.use('/api', routes); // mount API routes

// check server status
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// start server on port
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;