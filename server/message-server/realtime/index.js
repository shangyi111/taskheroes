const socketIo = require('socket.io');
const { getIO } = require('../../websocket/socketServer');
const messageHandlers = require('./message-handlers');
const chatroomHandlers = require('./chatroom-handlers');
const messageService = require('../controllers/message-service');
const chatroomService = require('../controllers/chatroom-service');

module.exports = (server) => {
  const io = getIO();

  io.on('connection', (socket) => {
    console.log('New client connected');

    messageHandlers(io, socket, messageService);
    chatroomHandlers(io, socket, chatroomService);

    socket.on('disconnect', () => {
      console.log('Client disconnected');
    });
  });
};