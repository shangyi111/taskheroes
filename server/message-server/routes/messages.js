const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const chatroomController = require('../controllers/chatroomController'); // Import chatroom controller

// Routes for messages within a specific chatroom
router.route('/chatrooms/:chatroomId')
  .get(messageController.getMessagesByChatroom) // Get messages for a chatroom
  .post(messageController.saveMessage);    // Save a new message in a chatroom

// Routes for chatrooms list for certain provider
router.route('/chatroom/chatrooms/provider/:providerId')
  .get(chatroomController.getChatroomsForProvider)

router.route('/chatroom')
  .post(chatroomController.createChatroom);    // Create a new chatroom   

module.exports = router;