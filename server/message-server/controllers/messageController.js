const { Message } = require('../../models'); 
const { getIO } = require('../../websocket/socketServer');
const crypto = require('crypto');

const algorithm = 'aes-256-cbc';
const encryptionKeyHex = process.env.MESSAGE_ENCRYPTION_KEY;
if (!encryptionKeyHex) {
  throw new Error('MESSAGE_ENCRYPTION_KEY is not defined in the environment.');
}
const encryptionKey  = Buffer.from(encryptionKeyHex, 'hex');

// Function to encrypt a message
function encryptMessage(text) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, encryptionKey, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return {
    iv: iv.toString('hex'),
    encryptedData: encrypted,
  };
}

// Function to decrypt a message
function decryptMessage(ivHex, encryptedData) {
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv(algorithm, encryptionKey, iv);
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

exports.saveMessage = async (messageData) => {
  try {
    const encrypted = encryptMessage(messageData.messageText); // Encrypt
    const savedMessage = await Message.create({
      chatroomId: messageData.chatroomId,
      senderId: messageData.senderId,
      messageText: encrypted.encryptedData, // Store encrypted
      iv: encrypted.iv, // Store IV
    });

    const messageToSend = {
      ...savedMessage.dataValues,
      messageText: messageData.messageText, // Decrypt before sending
    };
    getIO().to(messageData.chatroomId).emit('newMessage', messageToSend);
    return savedMessage;
  } catch (err) {
    console.error('Error saving message:', err);
    throw err;
  }
};

exports.getMessagesByChatroom = async (chatroomId) => {
  try {
    const messages = await Message.findAll({ where: { chatroomId } });
    const decryptedMessages = messages.map((message) => {
      const decryptedText = decryptMessage(message.iv, message.messageText);
      return {
        ...message.dataValues,
        messageText: decryptedText, // Decrypted text
      };
    });
    return decryptedMessages;
  } catch (err) {
    console.error('Error retrieving messages:', err);
    throw err;
  }
};

exports.getPaginatedMessages = async (chatroomId, offset, limit) => {
  try {
    const messages = await Message.findAll({
      where: { chatroomId },
      offset,
      limit,
    });
    const decryptedMessages = messages.map((message) => {
      const decryptedText = decryptMessage(message.iv, message.messageText);
      return {
        ...message.dataValues,
        messageText: decryptedText, // Decrypted text
      };
    });
    return decryptedMessages;
  } catch (err) {
    console.error('Error retrieving paginated messages:', err);
    throw err;
  }
};