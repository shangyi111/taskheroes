const jwt = require('jsonwebtoken');
require('dotenv').config();

const authenticateToken = (req, res, next) => {
  //Allow all OPTIONS (preflight) requests to pass
  if (req.method === 'OPTIONS') {
    return next();
  }

  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ 
        message: 'Authentication failed: Access token missing.',
        code: 'MISSING_TOKEN_ERROR',
        header: req.headers,
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
        return res.status(403).json({
            message: 'Authentication failed: Invalid or expired token.',
            code: 'INVALID_TOKEN_ERROR'
        });
    }
    req.user = user;
    next();
  });
};

module.exports = authenticateToken;