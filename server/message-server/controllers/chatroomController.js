
const { Chatroom, ChatroomUser, Job, User, Service } = require ('../../models');
const { getIO } =require ('../../websocket/socketServer');


const getChatroomIncludes = () => {
  return [
    {
      model: User,
      as: 'Customer', // Must match your association alias
      attributes: ['id', 'username', 'profilePicture'],
      required: true,
    },
    {
      model: User,
      as: 'Provider', // Must match your association alias
      attributes: ['id', 'username', 'profilePicture'],
      required: true,
    },
    {
      model: Job,
      as: 'Job', // Must match your association alias
      attributes: [
        ['jobTitle', 'jobTitle'],
        ['jobDate', 'jobDate'], 
        ['fee', 'fee'],
        ['location', 'jobLocation'],
        ['jobDescription', 'jobDescription'],
        ['jobStatus', 'jobStatus'],
      ],
      required: false, // Job is optional (can be null for general chats)
      include: [
        {
          model: Service, // Use your model name (Business or Service)
          as: 'Service',   // This must match the alias in your Job -> Service association
          attributes: ['businessName'],
        }
      ]
    }
  ];
};

// --- Helper function to map the joined data into the Frontend's ExtendedChatroom format ---
// This is the CRITICAL step to match the frontend structure
const mapChatroomData = (chatroom, currentUserId = null) => {
    if (!chatroom) return null;
    
    // Convert Sequelize instance to plain object
    const data = chatroom.get({ plain: true });

    // If the viewer is the Provider, the "Name" is the Customer's username.
    // If the viewer is the Customer, the "Name" is the Business Name from the Job's Service (if exists), otherwise the Provider's username.
    let displayName = "Chatroom";
    if (currentUserId) {
        displayName = (currentUserId == data.providerId) 
            ? data.Customer.username 
            : data.Job?.Service?.businessName || data.Provider.username;
    }
    return {
        // Core Chatroom Fields
        ...data,
        jobId: data.jobId, // Ensure jobId is present
        name: displayName,
        // User Context (Provider/Seeker)
        customerUsername: data.Customer.username,
        providerUsername: data.Provider.username,
        customerProfilePicture: data.Customer.profilePicture,
        providerProfilePicture: data.Provider.profilePicture,
        
        // Job Context (from Job model, if it exists)
        jobTitle: data.Job?.jobTitle || null,
        jobDate: data.Job?.jobDate || null,
        jobStatus: data.Job?.jobStatus || null,
        jobLocation: data.Job?.jobLocation || null,
        fee: data.Job?.fee || null,
        description: data.Job?.description || null,
        lastReadByMe: currentUserId === data.providerId ? data.lastReadByProvider : data.lastReadByCustomer
    };
};

exports.createChatroom = async (req, res) => {
  try {
    const { name, jobId, customerId, providerId } = req.body;
    console.log("req from createchatroom",req.body);

    if (!name || !customerId || !providerId) {
      return res.status(400).json({ message: 'Missing required chatroom fields: name, customerId, or providerId' });
    }

    let chatroom = await Chatroom.create({
      name,
      jobId: jobId || null,
      customerId,
      providerId,
    });
    chatroom = await Chatroom.findByPk(chatroom.id, { include: getChatroomIncludes() });
    
    const mappedChatroom = mapChatroomData(chatroom);
    
    getIO().emit('chatroomCreated', mappedChatroom);

    res.status(201).json(mappedChatroom);
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
      include: getChatroomIncludes(),
      order: [['lastActivityAt', 'DESC']],
    });

    if (chatrooms && chatrooms.length > 0) {
      const mappedChatrooms = chatrooms.map(room => mapChatroomData(room, providerId));
      res.json(mappedChatrooms);
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
      include: getChatroomIncludes(),
      order: [['lastActivityAt', 'DESC']],
    });

    if (chatrooms && chatrooms.length > 0) {
      const mappedChatrooms = chatrooms.map(room => {

        const mapped = mapChatroomData(room, customerId);
        // Logic: If activity is newer than the last time I read it, it's unread
        mapped.hasUnread = room.lastActivityAt > (room.lastReadByCustomer || 0);
        return mapped;
      });
      res.json(mappedChatrooms);
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
    const chatroom = await Chatroom.findByPk(chatroomId, {
      include: getChatroomIncludes(),
    });
    if (chatroom) {
      res.json(mapChatroomData(chatroom));
    } else {
      res.status(404).json({ message: 'Chatroom not found' });
    }
  } catch (err) {
    console.error('Error retrieving chatroom by ID:', err);
    res.status(500).json({ message: 'Internal Server Error', error: err.message });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const { chatroomId } = req.params;
    const userId = req.user.id; // From your auth middleware

    const chatroom = await Chatroom.findByPk(chatroomId);
    if (!chatroom) return res.status(404).json({ message: 'Chatroom not found' });

    // Update the correct column based on the user's role in this chat
    if (userId === chatroom.customerId) {
      await chatroom.update({ lastReadByCustomer: new Date() });
    } else if (userId === chatroom.providerId) {
      await chatroom.update({ lastReadByProvider: new Date() });
    }

    res.status(200).json({ message: 'Marked as read' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


