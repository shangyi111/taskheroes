const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');

// Routes for messages within a specific chatroom
router.route('/chatroom/:chatroomId')
  .get(messageController.getMessagesByChatroom) // Get messages for a chatroom
  .post(messageController.saveMessage);    // Save a new message in a chatroom

module.exports = router;