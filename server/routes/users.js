const express = require('express');
const router = express.Router();
const usersController = require('../controllers/usersController');


router.post('/batch', usersController.getUsersBatch);
// Get a specific user by userId
router.get('/:id', usersController.getUserById);

module.exports = router;