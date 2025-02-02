const jwt = require('jsonwebtoken');

function sanitizeUser(user) {
  // Force sanitization regardless of input type
  const sanitized = {
    _id: user._id?.toString() || user._id,
    email: user.email
  };
  
  console.log('Sanitizing user for token:', {
    inputType: typeof user,
    isMongooseDoc: !!user.toObject,
    sanitizedKeys: Object.keys(sanitized),
    sanitizedSize: JSON.stringify(sanitized).length
  });
  
  return sanitized;
}

/**
 * Generate a minimal access token (15 minutes expiry)
 * @param {Object} user - Mongoose User document
 */
function generateAccessToken(user) {
  const sanitizedUser = sanitizeUser(user);
  
  console.log('Generating access token:', {
    sanitizedUserSize: JSON.stringify(sanitizedUser).length,
    sanitizedUserKeys: Object.keys(sanitizedUser)
  });
  
  return jwt.sign(sanitizedUser, process.env.JWT_SECRET, { expiresIn: '15m' });
}

/**
 * Generate a minimal refresh token (7 days expiry)
 * @param {Object} user - Mongoose User document
 */
function generateRefreshToken(user) {
  const sanitizedUser = sanitizeUser(user);
  const payload = {
    _id: sanitizedUser._id,
    type: 'refresh'
  };
  
  console.log('Generating refresh token:', {
    payloadSize: JSON.stringify(payload).length,
    payloadKeys: Object.keys(payload)
  });
  
  return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
}

// Add a function to verify refresh tokens
function verifyRefreshToken(token) {
  try {
    return jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
  } catch (error) {
    return null;
  }
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken
};
