const jwt = require('jsonwebtoken');

/**
 * Generate a minimal access token (15 minutes expiry)
 * @param {Object} user - Mongoose User document
 */
function generateAccessToken(user) {
  const payload = {
    _id: user._id,
    email: user.email,
  };
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '15m' });
}

/**
 * Generate a minimal refresh token (7 days expiry)
 * @param {Object} user - Mongoose User document
 */
function generateRefreshToken(user) {
  const payload = {
    _id: user._id,
  };
  return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
}

module.exports = {
  generateAccessToken,
  generateRefreshToken
};
