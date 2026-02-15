const { Message, User, Chatroom } = require('../../models'); 
const eventBus = require('../../utils/eventBus');
const crypto = require('crypto');
const { getPagination, getPagingData } = require('../../utils/pagination');
const { Op } = require('sequelize');
const messageService = require('../../services/messageService');

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

// exports.saveMessage = async (req,res) => {
//   try {
//     const messageData = req.body;
//     const encrypted = encryptMessage(messageData.text); 
//     const savedMessage = await Message.create({
//       chatroomId: messageData.chatroomId,
//       senderId: messageData.senderId,
//       encryptedContent: encrypted.encryptedData, // Store encrypted
//       iv: encrypted.iv, // Store IV
//     });

//     let senderUsername = 'Unknown User';
//     const senderUser = await User.findByPk(savedMessage.senderId);
//     if (senderUser && senderUser.username) {
//         senderUsername = senderUser.username;
//     }

//     const decryptedText = decryptMessage(savedMessage.iv, savedMessage.encryptedContent);

//     const messageToSend = {
//       // Include all saved message properties (like ID, timestamps)
//       ...savedMessage.dataValues,
//       chatroomId: String(savedMessage.chatroomId),
//       senderUsername: senderUsername, // Use 'senderUsername' to match frontend interface
//       text: decryptedText, // Use 'text' to match frontend interface, contains decrypted content
//     };
//     eventBus.emit('NEW_MESSAGE_SAVED', messageToSend);
//     await Chatroom.update(
//       { lastActivityAt: new Date() },
//       { where: { id: messageData.chatroomId } }
//     );
//     return res.json(messageToSend);
//   } catch (err) {
//     console.error('Error saving message:', err);
//     throw err;
//   }
// };


exports.saveMessage = async (req, res) => {
  try {
    const { chatroomId, senderId, text } = req.body;
    const message = await messageService.sendInternalMessage({ chatroomId, senderId, text });
    return res.json(message);
  } catch (err) {
    res.status(500).json({ message: 'Error saving message' });
  }
};


exports.getMessagesByChatroom = async (req, res) => {
  try {
    const chatroomId = req.params.chatroomId;
    let messages = await Message.findAll({ 
        where: { chatroomId:chatroomId },  
        include: [{ model: User, as: 'sender', attributes: ['username'] }], 
        order: [['createdAt', 'ASC']]
      });
    const decryptedMessages = messages.map((message) => {
      const decryptedText = decryptMessage(message.iv, message.encryptedContent);
      return {
        ...message.dataValues,
        text: decryptedText,
        senderUsername: message.sender ? message.sender.username : 'Unknown User',
      };
    });
    res.json(decryptedMessages);
  } catch (err) {
    console.error('Error retrieving messages:', err);
    throw err;
  }
};

exports.getPaginatedMessages = async (req, res) => {
  try {
    const { chatroomId } = req.params;
    const { lastId, size } = req.query;
    const limit = size ? parseInt(size) : 20;
    const whereClause = { chatroomId };

    if (lastId) {
      whereClause.id = { [Op.lt]: lastId };
    }

    // 2. Use findAndCountAll to get both the rows and the total count
    const data = await Message.findAndCountAll({
      where: whereClause,
      limit,
      include: [{ model: User, as: 'sender', attributes: ['username'] }],
      order: [['createdAt', 'DESC']]
    });

    // 3. Decrypt the messages (the 'rows' from the data object)
    const decryptedItems = data.rows.map((message) => {
      const decryptedText = decryptMessage(message.iv, message.encryptedContent);
      return {
        ...message.dataValues,
        text: decryptedText, // Ensure this matches your frontend Message model
        senderUsername: message.sender ? message.sender.username : 'Unknown User',
      };
    });

    res.json({
      items: decryptedItems,
      totalItems: data.count,
      // Provide the ID of the oldest message in this batch for the next call
      nextCursor: decryptedItems.length > 0 ? decryptedItems[decryptedItems.length - 1].id : null
    });
    
  } catch (err) {
    console.error('Error retrieving paginated messages:', err);
    res.status(500).json({ message: 'Error retrieving messages' });
  }
};