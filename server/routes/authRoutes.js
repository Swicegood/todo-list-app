const express = require('express');
const jwt = require('jsonwebtoken');
const UserService = require('../services/userService.js');
const { requireUser } = require('./middleware/auth.js');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/auth');
const User = require('../models/user.js');

const router = express.Router();

/**
 * POST /api/auth/login
 * Body: { email: string, password: string }
 * Response: { user: { _id: string, email: string }, accessToken: string, refreshToken: string }
 */
router.post('/login', async (req, res) => {
  try {
    console.log('Login attempt received:', {
      email: req.body.email,
      hasPassword: !!req.body.password
    });

    const { email, password } = req.body;

    if (!email || !password) {
      console.log('Missing credentials');
      return res.status(400).json({ message: 'Email and password are required' });
    }

    try {
      console.log('Attempting to authenticate user');
      const user = await UserService.authenticateWithPassword(email, password);
      console.log('Authentication result:', {
        userFound: !!user,
        userType: user ? typeof user : null,
        hasToAuthJSON: user ? !!user.toAuthJSON : false
      });

      if (!user) {
        return res.status(400).json({ message: 'Email or password is incorrect' });
      }

      // Generate tokens with detailed logging
      console.log('Generating tokens for user:', {
        userId: user._id,
        userMethods: Object.keys(user.__proto__),
        isMongooseDoc: !!user.toObject
      });

      try {
        const authUser = user.toAuthJSON();
        console.log('Auth user data:', {
          authUserKeys: Object.keys(authUser),
          authUserSize: JSON.stringify(authUser).length
        });

        const accessToken = generateAccessToken(authUser);
        console.log('Access token generated:', {
          tokenLength: accessToken.length
        });

        const refreshToken = generateRefreshToken(authUser);
        console.log('Refresh token generated:', {
          tokenLength: refreshToken.length
        });

        // Store refresh token
        user.refreshToken = refreshToken;
        await user.save();
        console.log('User saved with new refresh token');

        return res.json({
          user: authUser,
          accessToken,
          refreshToken,
        });
      } catch (tokenError) {
        console.error('Token generation error:', tokenError);
        throw tokenError;
      }
    } catch (authError) {
      console.error('Authentication error:', authError);
      throw authError;
    }
  } catch (error) {
    console.error('Login route error:', {
      error,
      stack: error.stack,
      message: error.message
    });
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * POST /api/auth/register
 * Body: { email: string, password: string, ... }
 * Response: { user: Object }
 */
router.post('/register', async (req, res) => {
  console.log('Register attempt for email:', req.body.email);
  try {
    const user = await UserService.create(req.body);
    console.log('Registration successful for user:', user._id);
    return res.status(200).json(user);
  } catch (error) {
    console.error('Error while registering user:', error);
    return res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/auth/logout
 * Body: { email: string }
 * Response: { message: string }
 */
router.post('/logout', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded._id) {
          // Clear the refresh token from the user
          await User.findByIdAndUpdate(decoded._id, { 
            $set: { refreshToken: null } 
          });
        }
      } catch (err) {
        // Token verification failed, but we'll continue with logout
        console.log('Token verification failed during logout:', err);
      }
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({ message: 'Server error during logout' });
  }
});

/**
 * POST /api/auth/refresh
 * Body: { refreshToken: string }
 * Response: { success: boolean, data: { accessToken: string } }
 */
router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({
      success: false,
      message: 'Refresh token is required',
    });
  }

  try {
    // Verify the refresh token
    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded || decoded.type !== 'refresh') {
      return res.status(403).json({
        success: false,
        message: 'Invalid refresh token',
      });
    }

    // Get user and verify the refresh token matches
    const user = await UserService.get(decoded._id);
    console.log('Refresh - User retrieved:', {
      userObjSize: JSON.stringify(user).length,
      storedRefreshTokenSize: user.refreshToken?.length,
      receivedRefreshTokenSize: refreshToken.length,
      tokensMatch: user.refreshToken === refreshToken
    });
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(403).json({
        success: false,
        message: 'Invalid refresh token',
      });
    }

    // Generate new access token only using minimal user data
    const authUser = user.toAuthJSON();
    const newAccessToken = generateAccessToken(authUser);

    // Return only the new access token, not the user object
    return res.status(200).json({
      success: true,
      data: {
        accessToken: newAccessToken,
      },
    });
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: 'Invalid or expired refresh token',
    });
  }
});

/**
 * GET /api/auth/me
 * Protected route - returns minimal user info
 */
router.get('/me', requireUser, async (req, res) => {
  // Return only minimal user info from the middleware
  return res.status(200).json({
    _id: req.user._id,
    email: req.user.email,
  });
});

module.exports = router;
