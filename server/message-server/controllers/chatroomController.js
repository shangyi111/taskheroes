
const { Chatroom, ChatroomUser, Job, User, Service } = require ('../../models');
const { getIO } =require ('../../websocket/socketServer');
const { getPagination, getPagingData } = require('../../utils/pagination');


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
          attributes: ['businessName','profilePicture'],
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
    let isProvider = currentUserId == data.providerId;
    if (currentUserId) {
        displayName = isProvider
            ? data.Customer.username 
            : data.Job?.Service?.businessName || data.Provider.username;
    }
    return {
        // Core Identity
        id: data.id,
        jobId: data.jobId,
        customerId: data.customerId,
        providerId: data.providerId,
        name: displayName,
        lastActivityAt: data.lastActivityAt,

        // User Context
        customerUsername: data.Customer.username,
        providerUsername: data.Provider.username,
        customerProfilePicture: data.Customer.profilePicture,
        
        // Seeker sees Service Pic; Provider sees Customer Pic
        serviceProfilePicture: data.Job?.Service?.profilePicture?.url || data.Provider.profilePicture,

        // Flattened Job Attributes (Optional)
        jobTitle: data.Job?.jobTitle || null,
        jobDate: data.Job?.jobDate || null,
        jobStatus: data.Job?.jobStatus || null,
        jobLocation: data.Job?.jobLocation || null,
        fee: data.Job?.fee || null,
        description: data.Job?.jobDescription || null,

        // Read Status
        lastReadByMe: isProvider ? data.lastReadByProvider : data.lastReadByCustomer};
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

// For Seekers/Customers
exports.getChatroomsForCustomer = (req, res) => {
  return getChatroomsByRole(req, res, 'customerId', 'customer');
};

// For Providers
exports.getChatroomsForProvider = (req, res) => {
  return getChatroomsByRole(req, res, 'providerId', 'provider');
};

const getChatroomsByRole = async (req, res, roleIdField, roleName) => {
  try {
    const userId = req.params.seekerId || req.params.providerId;
    const { page, size } = req.query;

    if (!userId) {
      return res.status(400).json({ message: `${roleName} ID is required` });
    }

    const { limit, offset } = getPagination(page, size);
    const whereClause = { [roleIdField]: userId };

    const count = await Chatroom.count({
      where: whereClause,
      distinct: true 
    });

    const chatrooms = await Chatroom.findAll({
      where: whereClause,
      include: getChatroomIncludes(),
      order: [['lastActivityAt', 'DESC']],
      limit,
      offset
    });

    if (!chatrooms || chatrooms.length === 0) {
      return res.status(404).json({ message: `No chatrooms found for this ${roleName}` });
    }

    const mappedChatrooms = chatrooms.map(room => {
      const mapped = mapChatroomData(room, userId);
      
      // Dynamically check unread status based on role
      const lastReadField = roleIdField === 'customerId' ? 'lastReadByCustomer' : 'lastReadByProvider';
      mapped.hasUnread = room.lastActivityAt > (room[lastReadField] || 0);
      
      return mapped;
    });

    const response = getPagingData({ count, rows: mappedChatrooms }, page, limit);
    return res.json(response);

  } catch (err) {
    console.error(`Error retrieving chatrooms for ${roleName}:`, err);
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


