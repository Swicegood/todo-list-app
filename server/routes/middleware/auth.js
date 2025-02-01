const UserService = require('../../services/userService.js');
const jwt = require('jsonwebtoken');

const requireUser = (req, res, next) => {
  console.log('Auth middleware - Authorization header:', req.headers.authorization);
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    console.log('Auth middleware - No token provided');
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Auth middleware - Decoded token user:', decoded);
    req.user = decoded;
    next();
  } catch (err) {
    console.log('Auth middleware - Token verification failed:', err.message);
    return res.status(403).json({ error: 'Authentication required' });
  }
};

module.exports = {
  requireUser,
};