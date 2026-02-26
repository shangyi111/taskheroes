const express = require('express');
const router = express.Router();
const identityController = require('../controllers/identityController');
const authMiddleware = require('../auth/authMiddleware');

/**
 * @route   POST /api/identity/verify
 * @desc    Initiate a Stripe Identity Verification session
 * @access  Private
 */
router.post('/verify', authMiddleware, identityController.createVerificationSession);

module.exports = router;