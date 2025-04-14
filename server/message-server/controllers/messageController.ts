const { Message } = require('../../server/models'); // Adjust path as needed
const { getIO } = require('../../websocket/socketServer');

exports.saveMessage = async (messageData) => {
  try {
    const savedMessage = await Message.create(messageData);
    getIO().to(messageData.chatroomId).emit('newMessage', savedMessage);
    return savedMessage;
  } catch (err) {
    console.error('Error saving message:', err);
    throw err;
  }
};

exports.getMessagesByChatroom = async (chatroomId) => {
  try {
    return await Message.findAll({ where: { chatroomId } });
  } catch (err) {
    console.error('Error retrieving messages:', err);
    throw err;
  }
};

// Example: Implement message pagination
exports.getPaginatedMessages = async (chatroomId, offset, limit) => {
  try {
    return await Message.findAll({
      where: { chatroomId },
      offset,
      limit,
    });
  } catch (err) {
    console.error('Error retrieving paginated messages:', err);
    throw err;
  }
};