const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });
  console.log('Auth JWT_SECRET:', process.env.JWT_SECRET);
  console.log('Token received:', token);
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key'); // Fallback for safety
    req.user = decoded;
    next();
  } catch (error) {
    console.error('JWT Verify Error:', error.message);
    res.status(401).json({ message: 'Invalid token' });
  }
};

module.exports = auth;