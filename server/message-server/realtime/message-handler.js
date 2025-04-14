const messageController = require('../controllers/messageController');

module.exports = (io, socket) => {
  socket.on('message', async (messageData) => {
    try {
      await messageController.saveMessage(messageData);
    } catch (err) {
      console.error('Error saving message:', err);
    }
  });

  socket.on('send_message', async (messageData) => {
    try {
      await messageController.saveMessage(messageData);
    } catch (err) {
      console.error('Error saving message:', err);
    }
  });
};