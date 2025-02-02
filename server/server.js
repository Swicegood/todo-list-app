// Load environment variables
require("dotenv").config();
const mongoose = require("mongoose");
const express = require("express");
const session = require("express-session");
const MongoStore = require('connect-mongo');
const basicRoutes = require("./routes/index");
const authRoutes = require("./routes/authRoutes");
const { connectDB } = require("./config/database");
const cors = require("cors");

if (!process.env.DATABASE_URL) {
  console.error("Error: DATABASE_URL variables in .env missing.");
  process.exit(-1);
}

const app = express();
const port = process.env.PORT || 3000;

// CORS configuration
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Content-Type middleware
app.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json');
  next();
});

// Configure request size limits
app.use(express.json({ 
  limit: '1mb',
  verify: (req, res, buf) => {
    if (buf.length > 1024 * 1024) {
      throw new Error('Request body too large');
    }
  }
}));

app.use(express.urlencoded({ 
  extended: true, 
  limit: '1mb',
  parameterLimit: 1000 
}));

// Add security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

const startServer = async () => {
  try {
    console.log('Attempting to connect to MongoDB...');
    await connectDB();
    console.log('MongoDB connected successfully');

    // Session middleware
    app.use(
      session({
        secret: process.env.JWT_SECRET,
        resave: false,
        saveUninitialized: false,
        store: MongoStore.create({
          mongoUrl: process.env.DATABASE_URL,
          ttl: 14 * 24 * 60 * 60
        })
      })
    );

    // Routes
    app.use('/api/auth', authRoutes);
    app.use('/api/todos', require('./routes/todoRoutes'));
    app.use(basicRoutes);

    // Error handling
    app.use((err, req, res, next) => {
      console.error('Error details:', {
        message: err.message,
        stack: err.stack,
        body: req.body,
        headers: req.headers
      });
      
      if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({ error: 'Invalid JSON' });
      }
      
      res.status(500).json({ 
        error: "Internal server error",
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    });

    // 404 handler
    app.use((req, res) => {
      res.status(404).json({ error: "Route not found" });
    });

    app.listen(port, () => {
      console.log('=================================');
      console.log(`Server is running on port ${port}`);
      console.log('Routes configured:');
      console.log('- /api/auth/login');
      console.log('- /api/auth/register');
      console.log('- /api/todos');
      console.log('=================================');
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();