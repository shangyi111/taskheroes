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

module.exports = {authenticateToken,requireJobParticipant};