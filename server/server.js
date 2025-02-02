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

// Increase header size limit
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Configure CORS before routes
const corsOptions = {
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200,
  preflightContinue: false,
  maxAge: 86400 // Cache preflight request for 24 hours
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));

// Other app settings
app.enable('json spaces');
app.enable('strict routing');

// Increase header size limit for raw node server
app.use((req, res, next) => {
  req.connection.setMaxHeaderSize(81920); // 80KB
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
    app.use((req, res) => {
      res.status(404).json({ error: "Route not found" });
    });

    app.use((err, req, res, next) => {
      console.error(`Unhandled application error: ${err.message}`);
      console.error(err.stack);
      res.status(500).json({ error: "Internal server error" });
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