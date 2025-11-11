const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    console.log('🔐 Auth middleware - Token received:', token ? 'Yes' : 'No');
    
    if (!token) {
      console.log('❌ No token provided');
      return res.status(401).json({ message: 'No token, authorization denied' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    console.log('✅ Token decoded - User ID:', decoded.userId);
    
    // Verify user still exists
    const user = await User.findById(decoded.userId);
    if (!user) {
      console.log('❌ User not found for token');
      return res.status(401).json({ message: 'User not found' });
    }
    
    req.user = decoded;
    next();
  } catch (error) {
    console.error('❌ Auth middleware error:', error.message);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    
    res.status(500).json({ message: 'Server error during authentication' });
  }
};

module.exports = auth;