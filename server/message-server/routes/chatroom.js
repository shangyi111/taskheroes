const express = require('express');
const router = express.Router();
const chatroomController = require('../controllers/chatroomController'); // Import chatroom controller


// Routes for chatrooms list for certain provider
router.route('/chatrooms/provider/:providerId')
  .get(chatroomController.getChatroomsForProvider)

// Routes for chatrooms list for certain customer
router.route('/chatrooms/seeker/:seekerId')
  .get(chatroomController.getChatroomsForCustomer)

router.route('/:chatroomId')
  .get(chatroomController.getChatroomById)

router.route('/job/:jobId')
  .get(chatroomController.getChatroomByJobId)

router.route('')
  .post(chatroomController.createChatroom);

module.exports = router;