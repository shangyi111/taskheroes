const chatroomController = require('../controllers/chatroomController');

module.exports = (io, socket) => {
  socket.on('joinChatroom', (chatroomId) => {
    socket.join(chatroomId);
    console.log(`Socket ${socket.id} joined chatroom ${chatroomId}`);
  });

  socket.on('createChatroom', async (chatroomData) => {
    try {
      await chatroomController.createChatroom(
        chatroomData.userIds,
        chatroomData.isGroupChat,
        chatroomData.chatroomName
      );
    } catch (err) {
      console.error('Error creating chatroom: ', err);
      // Handle error, possibly emit an error event to the client
    }
  });

  socket.on('addUserToChatroom', async (addUserToChatroomData) => {
    try {
      await chatroomController.addUserToChatroom(addUserToChatroomData.chatroomId, addUserToChatroomData.userId);
    } catch (err) {
      console.error('Error adding user to chatroom: ', err);
    }
  });

  socket.on('removeUserFromChatroom', async (removeUserFromChatroomData) => {
    try {
      await chatroomController.removeUserFromChatroom(removeUserFromChatroomData.chatroomId, removeUserFromChatroomData.userId);
    } catch (err) {
      console.error('Error removing user from chatroom: ', err);
    }
  });
};