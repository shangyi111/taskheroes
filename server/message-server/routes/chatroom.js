const express = require('express');
const router = express.Router();
const chatroomController = require('../controllers/chatroomController');
const authMiddleware = require('../../auth/authMiddleware');


// Routes for chatrooms list for certain provider
router.route('/chatrooms/provider/:providerId')
  .get(authMiddleware,chatroomController.getChatroomsForProvider)

// Routes for chatrooms list for certain customer
router.route('/chatrooms/seeker/:seekerId')
  .get(authMiddleware,chatroomController.getChatroomsForCustomer)

router.route('/:chatroomId')
  .get(authMiddleware,chatroomController.getChatroomById)

router.route('/job/:jobId')
  .get(authMiddleware,chatroomController.getChatroomByJobId)

router.route('')
  .post(authMiddleware,chatroomController.createChatroom);

// Mark chatroom as read (The new optimized feature)
// Using PATCH because we are partially updating the chatroom record
router.patch('/:chatroomId/read', authMiddleware, chatroomController.markAsRead);

module.exports = router;