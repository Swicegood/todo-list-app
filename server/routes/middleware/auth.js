const UserService = require('../../services/userService.js');
const jwt = require('jsonwebtoken');

/**
 * Require a valid bearer token on each request
 */
async function requireUser(req, res, next) {
  console.log('Auth middleware - Authorization header:', req.headers.authorization);
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Auth middleware - Decoded token user:', decoded);

    // Attach minimal info
    req.user = {
      _id: decoded._id,
      email: decoded.email
    };

    next();
  } catch (err) {
    console.log('Auth middleware - Token verification failed:', err.message);
    return res.status(403).json({ error: 'Authentication required' });
  }
}

module.exports = {
  requireUser,
};