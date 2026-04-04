const jwt = require('jsonwebtoken');
require('dotenv').config();
const Job = require('../models/job');

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
        console.log('JWT verification error:', err);
        return res.status(403).json({
            message: 'Authentication failed: Invalid or expired token.',
            code: 'INVALID_TOKEN_ERROR'
        });
    }
    req.user = user;
    next();
  });
};

/**
 * Defense in Depth: Ensures the authenticated user is either 
 * the Seeker or the Provider of the specific job.
 */
const requireJobParticipant = async (req, res, next) => {
  try {
    const jobId = req.params.id;
    const userId = req.user.id; // From your existing authMiddleware

    const job = await Job.findByPk(jobId);

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    const isSeeker = job.customerId === userId;
    const isProvider = job.performerId === userId;

    if (!isSeeker && !isProvider) {
      // Log this! It's likely a malicious IDOR attempt.
      console.warn(`Unauthorized access attempt by User ${userId} on Job ${jobId}`);
      return res.status(403).json({ message: 'Access denied to this resource.' });
    }

    // Optimization: Attach the job to the request so the controller doesn't fetch it again
    req.job = job;
    next();
  } catch (error) {
    res.status(500).json({ message: 'Internal Authorization Error' });
  }
};

/**
 * Optional Auth: 
 * If a valid token is present, attaches req.user.
 * If no token (or an expired token) is present, allows the request to continue as a Guest.
 */
const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  // 1. If there is no token, just move on to the controller. req.user remains undefined.
  if (!token) {
    return next(); 
  }

  // 2. If there is a token, try to verify it.
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (!err) {
      // 3. Token is valid! Attach the user identity so `scrubService` knows who this is.
      req.user = user; 
    }
    
    // 4. Even if there is an error (like an expired token), we don't block the request.
    // We just call next() and let them browse as a Guest.
    next();
  });
};

module.exports = {authenticateToken,requireJobParticipant, optionalAuth};