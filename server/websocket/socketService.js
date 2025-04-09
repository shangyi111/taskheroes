const { getIO } = require('./socketServer');

function emitToUser(userId, type, data) {
  const io = getIO();
  console.log("emiting inside emitouser");
  io.to(`user_${userId}`).emit('user_event', { type, data });
}

module.exports = {
  emitToUser,
};
