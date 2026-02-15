const { Message, User, Chatroom } = require('../models');
const { encryptMessage } = require('../utils/cryptoUtils');
const eventBus = require('../utils/eventBus');

exports.sendInternalMessage = async ({ chatroomId, senderId, text }) => {
  // 1. Encrypt
  const encrypted = encryptMessage(text);

  // 2. Save to DB
  const savedMessage = await Message.create({
    chatroomId,
    senderId,
    encryptedContent: encrypted.encryptedData,
    iv: encrypted.iv,
  });

  // 3. Get Username
  const senderUser = await User.findByPk(senderId, { attributes: ['username'] });
  const senderUsername = senderUser?.username || 'Unknown User';

  // 4. Prepare Payload for Frontend
  const messagePayload = {
    ...savedMessage.dataValues,
    chatroomId: String(chatroomId),
    senderUsername,
    text, // Decrypted text
  };

  // 5. Trigger Real-time Events
  eventBus.emit('NEW_MESSAGE_SAVED', messagePayload);

  // 6. Update Activity Timestamp
  await Chatroom.update(
    { lastActivityAt: new Date() },
    { where: { id: chatroomId } }
  );

  return messagePayload;
};