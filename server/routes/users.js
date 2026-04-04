const express = require('express');
const router = express.Router();
const usersController = require('../controllers/usersController');
const { authenticateToken } = require('../auth/authMiddleware');


router.post('/batch',  authenticateToken, usersController.getUsersBatch);
router.post('/publicbatch',  usersController.getPublicUserBatch);
// Get a specific user by userId
router.get('/:id', authenticateToken, usersController.getUserById);

router.put('/me', authenticateToken, usersController.updateMe);
router.put('/me/security',authenticateToken, usersController.updateSecurity);

module.exports = router;