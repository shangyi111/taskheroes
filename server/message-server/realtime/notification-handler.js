const { emitToUser } = require('../../websocket/socketService');

// Notify the Provider that a new conversation has been initiated
function sendChatroomCreated(chatroom, providerId) {
  emitToUser(providerId, 'chatroom_created', chatroom);
}

module.exports = { sendChatroomCreated };