const express = require('express');
const { signup, login, googleLogin } = require('./authController');
const router = express.Router();
const rateLimit = require('express-rate-limit');


const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 requests per window
  message: 'Too many login attempts, please try again after 15 minutes'
});
// POST /signup - user signup
router.post('/signup', authLimiter,signup);

// POST /login - user login
router.post('/login',authLimiter, login);

// POST /google - Google OAuth login
router.post('/google',authLimiter, googleLogin);

module.exports = router;
