const { Service } = require('../models');
const {Review} = require('../models');
const {
  sendServiceUpdated,
  sendServiceCreated,
  sendServiceDeleted,
} = require('../websocket/handlers/serviceHandler');


/**
 * Utility to remove private JSONB slots for Seekers.
 * If the requester is the owner, return the full object.
 */
const scrubService = (service, requesterId) => {
  const data = service.get({ plain: true });
  const isOwner = requesterId && String(data.userId) === String(requesterId);

  if (!isOwner && data.customSections) {
    // 1. Check fixed slots (FAQ is public, Payment is private)
    if (data.customSections.payment && !data.customSections.payment.isPublic) {
      delete data.customSections.payment;
    }
    
    // 2. Filter dynamic arrays
    if (Array.isArray(data.customSections.links)) {
      data.customSections.links = data.customSections.links.filter(l => l.isPublic);
    }
    if (Array.isArray(data.customSections.additional)) {
      data.customSections.additional = data.customSections.additional.filter(a => a.isPublic);
    }
  }
  
  return { ...data, isOwner };
};
// Get all services
exports.getAllServices = async (req, res) => {
  try {
    const { excludeUserId } = req.query;
    const where = {};

    if (excludeUserId) {
      where.userId = { [Op.ne]: excludeUserId };
    }
    const services = await Service.findAll({
      where,
      include:[ Review],
      order: [['createdAt', 'DESC']]
    });
    const scrubbed = services.map(s => scrubService(s, req.user?.id));
    res.json(scrubbed); 
  } catch (error) {
    console.log("error inside get all services",error);
    res.status(500).json({ message: error.message });
  }
};

exports.getServicesByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    const services = await Service.findAll({
      where: { userId: userId },
      include: [Review],
      order: [['createdAt', 'DESC']]
    });

    // We still scrub! If the requester is the owner, scrubService keeps the private data.
    // If a Seeker is looking at a Provider's public profile, the private data is hidden.
    const scrubbed = services.map(s => scrubService(s, req.user?.id));
    res.json(scrubbed);
  } catch (error) {
    console.error("Error fetching user's services:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get a specific service by ID
exports.getServiceById = async (req, res) => {
  try {
    const service = await Service.findByPk(req.params.id);
    if (service) {
      const scrubbed = scrubService(service, req.user?.id);
      res.json(scrubbed);
    } else {
      res.status(404).json({ message: 'Service not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a new service
exports.createService = async (req, res) => {
  try {
    const newService = await Service.create({ ...req.body, userId: req.user.id }); 
    res.status(201).json(newService);
    sendServiceCreated(newService);
  } catch (error) {
    const message = error.errors[0].message;
    res.status(400).json({ message });
  }
};

exports.updateService = async (req, res) => {
  try {
    const serviceId = req.params.id;
    const userId = req.user.id;
    const service = await Service.findOne({
      where: { id: serviceId, userId: userId }
    });

    if (!service) {
      return res.status(404).json({ message: 'Service not found or unauthorized' });
    }

    const allowedFields = [
      'businessName', 
      'businessAddress', 
      'phoneNumber', 
      'category', 
      'hourlyRate', 
      'customSections',
      'availabilityWindowDays', 
      'portfolio', 
      'profilePicture'
    ];

    let hasChanges = false;
    Object.keys(req.body).forEach((key) => {
      if (allowedFields.includes(key)) {
        service[key] = req.body[key];
        hasChanges = true;
      }
    });

    if (!hasChanges) {
      return res.status(400).json({ message: 'No valid fields provided for update.' });
    }
    await service.save();

    res.status(200).json(service);
    sendServiceUpdated(service);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateAvailabilityWindow = async (req, res) => {
  try {
    const serviceId = req.params.id;
    const { availabilityWindowDays } = req.body;
    const userId = req.user.id;

    if (typeof availabilityWindowDays !== 'number' || availabilityWindowDays < 1) {
        return res.status(400).json({ message: 'Availability window must be a positive number.' });
    }

    const service = await Service.findOne({
      where: { id: serviceId, userId: userId }
    });

    if (!service) {
      return res.status(404).json({ 
        message: 'Service not found or user is not authorized.' 
      });
    }
    // Perform a targeted update query
    service.availabilityWindowDays = availabilityWindowDays;

    // 4. Save (This increments 'version' and handles hooks)
    await service.save();

    // 5. Respond & Broadcast
    res.status(200).json(service);
    sendServiceUpdated(service);
  } catch (error) {
    console.error('Error updating availability window:', error);
    if (error.name === 'SequelizeOptimisticLockError') {
      return res.status(409).json({ message: 'Conflict: Please refresh and try again.' });
    }
    // Note: If error.errors exists, it's a Sequelize validation error
    const message = error.errors ? error.errors[0].message : error.message; 
    res.status(500).json({ message: message });
  }
};

// Delete a service
exports.deleteService = async (req, res) => {
  try {
   const service = await Service.findOne({ 
      where: { id: req.params.id, userId: req.user.id } 
    });

    if (!service) return res.status(404).json({ message: 'Not found' });
    await service.destroy();
    sendServiceDeleted(service.id, req.user.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};