const express = require('express');
const { signup, login, googleLogin } = require('./authController');
const router = express.Router();

// POST /signup - user signup
router.post('/signup', signup);

// POST /login - user login
router.post('/login', login);

// POST /google - Google OAuth login
router.post('/google', googleLogin);

module.exports = router;
