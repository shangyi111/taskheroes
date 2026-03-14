const express = require('express');
const router = express.Router();
const usersController = require('../controllers/usersController');
const { authenticateToken } = require('../auth/authMiddleware');


router.post('/batch',  usersController.getUsersBatch);
// Get a specific user by userId
router.get('/:id', authenticateToken, usersController.getUserById);

router.put('/me/security',authenticateToken, usersController.updateSecurity);

module.exports = router;