
const { Chatroom, ChatroomUser } = require ('../../models');
const { getIO } =require ('../../websocket/socketServer');

exports.createChatroom = async (req, res) => {
  try {
    const { name, jobId, customerId, providerId } = req.body;
    console.log("req from createchatroom",req);

    if (!name || !customerId || !providerId) {
      return res.status(400).json({ message: 'Missing required chatroom fields: name, customerId, or providerId' });
    }

    const chatroom = await Chatroom.create({
      name,
      jobId: jobId || null,
      customerId,
      providerId,
    });

    getIO().emit('chatroomCreated', chatroom);

    res.status(201).json(chatroom);
  } catch (err) {
    console.error('Error creating chatroom:', err);
    res.status(500).json({ message: 'Internal Server Error', error: err.message });
  }
};

exports.getChatroomsForProvider = async (req, res) => {
  try {
    const providerId = req.params.providerId;
    if (!providerId) {
      return res.status(400).json({ message: 'Provider ID is required' });
    }

    const chatrooms = await Chatroom.findAll({
      where: { providerId: providerId },
    });

    if (chatrooms && chatrooms.length > 0) {
      res.json(chatrooms);
    } else {
      res.status(404).json({ message: 'No chatrooms found for this provider' });
    }
  } catch (err) {
    console.error('Error retrieving chatrooms for provider:', err);
    res.status(500).json({ message: 'Internal Server Error', error: err.message });
  }
};

exports.getChatroomsForCustomer = async (req, res) => {
  try {
    const customerId = req.params.seekerId;
    if (!customerId) {
      return res.status(400).json({ message: 'Customer ID is required' });
    }

    const chatrooms = await Chatroom.findAll({
      where: { customerId: customerId },
    });

    if (chatrooms && chatrooms.length > 0) {
      res.json(chatrooms);
    } else {
      res.status(404).json({ message: 'No chatrooms found for this customer' });
    }
  } catch (err) {
    console.error('Error retrieving chatrooms for customer:', err);
    res.status(500).json({ message: 'Internal Server Error', error: err.message });
  }
};

exports.getChatroomByJobId = async (req, res) => {
  try {
    const jobId = req.params.jobId;
    if (!jobId) {
      return res.status(400).json({ message: 'Job ID is required' });
    }

    const chatrooms = await Chatroom.findAll({
      where: { jobId: jobId },
    });
    res.json(chatrooms);
  } catch (err) {
    console.error('Error retrieving chatrooms for job:', err);
    res.status(500).json({ message: 'Internal Server Error', error: err.message });
  }
};

exports.addUserToChatroom = async (req, res) => {
  try {
    const { chatroomId, userId } = req.body;
    if (!chatroomId || !userId) {
      return res.status(400).json({ message: 'Chatroom ID and User ID are required' });
    }
    const result = await ChatroomUser.create({ chatroomId, userId });
    getIO().to(chatroomId).emit('userAddedToChatroom', { chatroomId, userId });
    res.status(200).json(result);
  } catch (err) {
    console.error('Error adding user to chatroom: ', err);
    res.status(500).json({ message: 'Internal Server Error', error: err.message });
  }
};

exports.removeUserFromChatroom = async (req, res) => {
  try {
    const { chatroomId, userId } = req.body;
    if (!chatroomId || !userId) {
      return res.status(400).json({ message: 'Chatroom ID and User ID are required' });
    }
    const result = await ChatroomUser.destroy({ where: { chatroomId, userId } });
    getIO().to(chatroomId).emit('userRemovedFromChatroom', { chatroomId, userId });
    res.status(200).json({ message: 'User removed successfully', rowsAffected: result });
  } catch (err) {
    console.error('Error removing user from chatroom: ', err);
    res.status(500).json({ message: 'Internal Server Error', error: err.message });
  }
};

exports.getChatroomById = async (req, res) => {
  try {
    const chatroomId = req.params.chatroomId;
    if (!chatroomId) {
      return res.status(400).json({ message: 'Chatroom ID is required' });
    }
    const chatroom = await Chatroom.findByPk(chatroomId);
    if (chatroom) {
      res.json(chatroom);
    } else {
      res.status(404).json({ message: 'Chatroom not found' });
    }
  } catch (err) {
    console.error('Error retrieving chatroom by ID:', err);
    res.status(500).json({ message: 'Internal Server Error', error: err.message });
  }
};


