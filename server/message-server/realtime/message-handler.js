const messageController = require('../controllers/messageController');

module.exports = (io, socket) => {
  socket.on('message', async (messageData) => { 
    try {
      await messageController.saveMessage(messageData);
      io.emit('message', messageData); 
    } catch (err) {
      console.error('Error saving message:', err);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });
};
