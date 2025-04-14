const { Chatroom, ChatroomUser } = require('../../server/models'); // Adjust path
const { getIO } = require('../../websocket/socketServer');

exports.createChatroom = async (userIds, isGroupChat = false, chatroomName = null) => {
  try {
    const chatroom = await Chatroom.create({ isGroupChat, chatroomName });
    await Promise.all(
      userIds.map((userId) =>
        ChatroomUser.create({ chatroomId: chatroom.id, userId })
      )
    );
    getIO().emit('chatroomCreated', chatroom);
    return chatroom;
  } catch (err) {
    console.error('Error creating chatroom:', err);
    throw err;
  }
};

exports.getChatroomsForUser = async (userId) => {
  try {
    return await Chatroom.findAll({
      include: [
        {
          model: ChatroomUser,
          where: { userId },
        },
      ],
    });
  } catch (err) {
    console.error('Error retrieving chatrooms:', err);
    throw err;
  }
};

exports.addUserToChatroom = async (chatroomId, userId) => {
  try {
    const result = await ChatroomUser.create({ chatroomId, userId });
    getIO().to(chatroomId).emit('userAddedToChatroom', { chatroomId, userId });
    return result;
  } catch (err) {
    console.error('Error adding user to chatroom: ', err);
    throw err;
  }
};

exports.removeUserFromChatroom = async (chatroomId, userId) => {
  try {
    const result = await ChatroomUser.destroy({ where: { chatroomId, userId } });
    getIO().to(chatroomId).emit('userRemovedFromChatroom', { chatroomId, userId });
    return result;
  } catch (err) {
    console.error('Error removing user from chatroom: ', err);
    throw err;
  }
};