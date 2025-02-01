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

// Pretty-print JSON responses
app.enable('json spaces');
// We want to be consistent with URL paths, so we enable strict routing
app.enable('strict routing');

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Test route to verify server is responding
app.get('/api/test', (req, res) => {
  console.log('Test endpoint hit');
  res.json({ message: 'Server is running' });
});

// Connect to MongoDB before starting server
const startServer = async () => {
  try {
    console.log('Attempting to connect to MongoDB...');
    await connectDB();
    console.log('MongoDB connected successfully');

    // Session middleware configuration
    app.use(
      session({
        secret: process.env.JWT_SECRET,
        resave: false,
        saveUninitialized: false,
        store: MongoStore.create({
          mongoUrl: process.env.DATABASE_URL,
          ttl: 14 * 24 * 60 * 60 // = 14 days
        })
      })
    );

    // Authentication routes
    app.use(authRoutes);

    // Basic Routes
    app.use(basicRoutes);
    // Authentication Routes
    app.use('/api/auth', authRoutes);
    // Todo Routes
    app.use('/api/todos', require('./routes/todoRoutes'));

    // If no routes handled the request, it's a 404
    app.use((req, res, next) => {
      res.status(404).send("Page not found.");
    });

    // Error handling
    app.use((err, req, res, next) => {
      console.error(`Unhandled application error: ${err.message}`);
      console.error(err.stack);
      res.status(500).send("There was an error serving your request.");
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