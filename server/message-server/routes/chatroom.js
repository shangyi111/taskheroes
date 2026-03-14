const express = require('express');
const router = express.Router();
const chatroomController = require('../controllers/chatroomController');
const {authenticateToken} = require('../../auth/authMiddleware');


// Routes for chatrooms list for certain provider
router.route('/chatrooms/provider/:providerId')
  .get(authenticateToken,chatroomController.getChatroomsForProvider)

// Routes for chatrooms list for certain customer
router.route('/chatrooms/seeker/:seekerId')
  .get(authenticateToken,chatroomController.getChatroomsForCustomer)

router.route('/:chatroomId')
  .get(authenticateToken,chatroomController.getChatroomById)

router.route('/job/:jobId')
  .get(authenticateToken,chatroomController.getChatroomByJobId)

router.route('')
  .post(authenticateToken,chatroomController.createChatroom);

// Mark chatroom as read (The new optimized feature)
// Using PATCH because we are partially updating the chatroom record
router.patch('/:chatroomId/read', authenticateToken, chatroomController.markAsRead);

module.exports = router;