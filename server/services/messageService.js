const { Message, User, Chatroom } = require('../models');
const { encryptMessage } = require('../utils/cryptoUtils');
const eventBus = require('../utils/eventBus');

// 1. Add the attachment fields to the destructured parameters
exports.sendInternalMessage = async ({ chatroomId, senderId, text, attachmentUrl, attachmentType, attachmentName }) => {
  
  // 2. Safeguard: If they only send a file, encrypt an empty string instead of crashing
  const safeText = text || '';
  
  // 3. Encrypt the safe text
  const encrypted = encryptMessage(safeText);

  // 4. Save to DB with the new attachment columns
  const savedMessage = await Message.create({
    chatroomId,
    senderId,
    encryptedContent: encrypted.encryptedData,
    iv: encrypted.iv,
    attachmentUrl: attachmentUrl || null,
    attachmentType: attachmentType || null,
    attachmentName: attachmentName || null,
  });

  // 5. Get Username
  const senderUser = await User.findByPk(senderId, { attributes: ['username'] });
  const senderUsername = senderUser?.username || 'Unknown User';

  // 6. Prepare Payload for Frontend
  const messagePayload = {
    ...savedMessage.dataValues, // This automatically grabs the new attachment fields!
    chatroomId: String(chatroomId),
    senderUsername,
    text: safeText, // Send back the safe, decrypted text
  };

  // 7. Trigger Real-time Events
  eventBus.emit('NEW_MESSAGE_SAVED', messagePayload);

  // 8. Update Activity Timestamp
  await Chatroom.update(
    { lastActivityAt: new Date() },
    { where: { id: chatroomId } }
  );

  return messagePayload;
};