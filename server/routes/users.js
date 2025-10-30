const express = require('express');
const router = express.Router();
const usersController = require('../controllers/usersController');

// Get a specific user by userId
router.get('/:id', usersController.getUserById);

module.exports = router;