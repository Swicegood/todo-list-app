const express = require('express');
const UserService = require('../services/userService.js');
const { requireUser } = require('./middleware/auth.js');
const { generateAccessToken, generateRefreshToken } = require('../utils/auth.js');
const jwt = require('jsonwebtoken');

const router = express.Router();

/**
 * POST /api/auth/login
 * Body: { email: string, password: string }
 * Response: { user: { _id: string, email: string }, accessToken: string, refreshToken: string }
 */
router.post('/login', async (req, res) => {
  console.log('Login attempt for email:', req.body.email);
  const { email, password } = req.body;

  // Validate input
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  // Authenticate
  const user = await UserService.authenticateWithPassword(email, password);
  
  if (!user) {
    return res.status(400).json({ message: 'Email or password is incorrect' });
  }
  
  // Generate minimal tokens
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  // Save refresh token in DB
  user.refreshToken = refreshToken;
  await user.save();

  console.log('Login successful for user:', user._id);

  // Return minimal user info and tokens
  return res.json({
    user: {
      _id: user._id,
      email: user.email
    },
    accessToken,
    refreshToken
  });
});

router.post('/register', async (req, res, next) => {
  console.log('Register attempt for email:', req.body.email);
  if (req.user) {
    console.log('User already exists:', req.user);
    return res.json({ user: req.user });
  }
  try {
    const user = await UserService.create(req.body);
    console.log('Registration successful for user:', user._id);
    return res.status(200).json(user);
  } catch (error) {
    console.error(`Error while registering user:`, error);
    return res.status(400).json({ error: error.message });
  }
});

router.post('/logout', async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (user) {
    user.refreshToken = null;
    await user.save();
  }

  res.status(200).json({ message: 'User logged out successfully.' });
});

/**
 * POST /api/auth/refresh
 * Body: { refreshToken: string }
 * Response: { success: boolean, data: { accessToken: string, refreshToken: string } }
 */
router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({
      success: false,
      message: 'Refresh token is required'
    });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    const user = await UserService.get(decoded._id);

    // Validate user and ensure refresh tokens match
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(403).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }

    // Generate new tokens
    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    // Save the new refresh token in the DB
    user.refreshToken = newRefreshToken;
    await user.save();

    return res.status(200).json({
      success: true,
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken
      }
    });

  } catch (error) {
    console.error(`Token refresh error: ${error.message}`);
    return res.status(403).json({
      success: false,
      message: 'Invalid or expired refresh token'
    });
  }
});

router.get('/me', requireUser, async (req, res) => {
  return res.status(200).json(req.user);
});

module.exports = router;
