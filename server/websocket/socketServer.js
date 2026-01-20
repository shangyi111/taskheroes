const { Server } = require('socket.io');
const chatroomHandlers = require('../message-server/realtime/chatroom-handler'); 
const messageHandlers = require('../message-server/realtime/message-handler');   
const userSocketMap = new Map();
const eventBus = require('../utils/eventBus');

function init(server) {
  io = new Server(server, {
    cors: {
      origin: 'http://localhost:4200',
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);

    const userId = socket.handshake.auth?.userId || socket.handshake.query?.userId;

    if (userId) {
      handleUserConnection(userId, socket);
    }

    chatroomHandlers(io, socket); 
    messageHandlers(io, socket);

    socket.on("message", function message(data) {
        console.log("received: %s", data);
      });
    socket.on('join_user_room', (userId) => {
      socket.join(`user_${userId}`);
      console.log(`Socket ${socket.id} joined room user_${userId}`);
    });

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });

  eventBus.on('NEW_MESSAGE_SAVED', (messageToSend) => {
    const roomId = String(messageToSend.chatroomId); //
    console.log(`Event Bus: Broadcasting to room ${roomId}`);
    
    // Use the local io instance to emit to the specific room
    io.to(roomId).emit('newMessage', messageToSend);
  });

  console.log('WebSocket server initialized');
}

/** * Helper to register a user's socket and join their private room
 */
function handleUserConnection(userId, socket) {
  const uid = String(userId);
  
  // Join private room (e.g., "user_5") for simple io.to() calls
  socket.join(`user_${uid}`);

  // Map the socket ID for complex operations (like forcing a room leave)
  if (!userSocketMap.has(uid)) {
    userSocketMap.set(uid, new Set());
  }
  userSocketMap.get(uid).add(socket.id);
  
  // Attach userId to the socket object for easy access during disconnect
  socket.userId = uid;
  
  console.log(`User ${uid} mapped to socket ${socket.id}`);
}

/**
 * Helper to clean up the map when a socket closes
 */
function handleUserDisconnect(socket) {
  const userId = socket.userId;
  if (userId && userSocketMap.has(userId)) {
    const sockets = userSocketMap.get(userId);
    sockets.delete(socket.id);
    
    if (sockets.size === 0) {
      userSocketMap.delete(userId);
    }
  }
}

/**
 * Returns a Set of all active socket IDs for a specific user
 * Useful for forcing a user to leave a chatroom across all their tabs
 */
function getSocketsByUserId(userId) {
  return userSocketMap.get(String(userId)) || new Set();
}
function getIO() {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
}

module.exports = { init, getIO, getSocketsByUserId };
