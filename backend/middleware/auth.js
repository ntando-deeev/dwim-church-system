const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) {
    return res.status(401).json({ error: 'Not authorized, no token' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user || !req.user.isActive) {
      return res.status(401).json({ error: 'Account not found or deactivated' });
    }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Not authorized, invalid token' });
  }
};

exports.adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') return next();
  return res.status(403).json({ error: 'Admin access required' });
};

exports.adminOrPastor = (req, res, next) => {
  if (req.user && ['admin', 'pastor'].includes(req.user.role)) return next();
  return res.status(403).json({ error: 'Admin or Pastor access required' });
};
