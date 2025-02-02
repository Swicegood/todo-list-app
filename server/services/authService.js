const generateAccessToken = (user) => {
  // Only include essential user data in the token
  const payload = {
    _id: user._id,
    email: user.email
  };
  
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '15m' });
};

const generateRefreshToken = (user) => {
  // Only include user ID in refresh token
  const payload = {
    _id: user._id
  };
  
  return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
}; 