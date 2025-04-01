const express = require('express');
const { signup, login } = require('./authController');
const router = express.Router();

// POST /signup - user signup
router.post('/signup', signup);

// POST /login - user login
router.post('/login', login);

module.exports = router;
