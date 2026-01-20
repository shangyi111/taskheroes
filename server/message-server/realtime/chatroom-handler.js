const chatroomController = require('../controllers/chatroomController');
const { findSocketByUserId } = require('../../websocket/socketServer');

module.exports = (io, socket) => {
  socket.on('joinChatroom', (chatroomId) => {
    console.log('--- JOIN ATTEMPT RECEIVED ---');
    console.log("socket info:", socket.userId);
    // Safety check: extract ID if an object was passed
    socket.join(chatroomId.chatroomId);
    console.log(`Socket user ${socket.userId} joined chatroom ${chatroomId.chatroomId}`);
  });

  // 2. Leave the channel when the component is destroyed
  socket.on('leaveChatroom', (chatroomId) => {
    socket.leave(`${chatroomId}`);
    console.log(`User ${socket.userId} left live chat chatroom: ${chatroomId}`);
  });


  socket.on('addUserToChatroom', async (addUserToChatroomData) => {
    try {
      const { chatroomId, userId } = addUserToChatroomData;
      await chatroomController.addUserToChatroom(chatroomId, userId);

      // Notify the specific user that they were added
      // This allows their UI to show the new chatroom in their list
      io.to(`user_${userId}`).emit('added_to_chatroom', { chatroomId });
      console.log(`User ${userId} successfully added to chatroom ${chatroomId}`);
    } catch (err) {
      console.error('Error adding user to chatroom: ', err);
    }
  });

  socket.on('removeUserFromChatroom', async (removeUserFromChatroomData) => {
    try {
      const { chatroomId, userId } = removeUserFromChatroomData;
      await chatroomController.removeUserFromChatroom(chatroomId, userId);

      // Force that user's socket to leave the room channel
      const targetSocket = findSocketByUserId(userId); // Helper to find their active socket
      if (targetSocket) {
        targetSocket.leave(`chatroom_${chatroomId}`);
      }
    } catch (err) {
      console.error('Error removing user from chatroom: ', err);
    }
  });
};