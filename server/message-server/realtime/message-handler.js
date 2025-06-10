const messageController = require('../controllers/messageController');

module.exports = (io, socket) => {
  socket.on('message', async (messageData) => { // Use 'message'
    try {
      await messageController.saveMessage(messageData);
      //  Emit the message to the sender and other connected clients.
      io.emit('message', messageData); //  Use 'message'
    } catch (err) {
      console.error('Error saving message:', err);
      //  Send an error event to the client
      socket.emit('error', { message: 'Failed to send message' });
    }
  });
};
