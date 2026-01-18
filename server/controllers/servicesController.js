const { Service } = require('../models');
const {Review} = require('../models');
const {
  sendServiceUpdated,
  sendServiceCreated,
  sendServiceDeleted,
} = require('../websocket/handlers/serviceHandler');

// Get all services
exports.getAllServices = async (req, res) => {
  try {
    const services = await Service.findAll({
      include:[ Review]
    });
    res.json(services);
  } catch (error) {
    console.log("error inside get all services",error);
    res.status(500).json({ message: error.message });
  }
};

// Get a specific service by ID
exports.getServiceById = async (req, res) => {
  try {
    const service = await Service.findByPk(req.params.id);
    if (service) {
      res.json(service);
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
    const [updatedRowCount] = await Service.update(req.body, {
      where: { id: serviceId, userId: req.user.id }, // Ensure user owns the service
      individualHooks: true,
      returning: true, // To get the updated record
    });

    if (updatedRowCount > 0) {
      const updatedService = await Service.findByPk(serviceId);
      res.status(200).json(updatedService);
      sendServiceUpdated(updatedService);
    } else {
      res.status(404).json({ message: 'Service not found or unauthorized' });
    }
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
    // Perform a targeted update query
    const [updatedRows] = await Service.update(
        { availabilityWindowDays: availabilityWindowDays },
        { 
            where: { id: serviceId, userId: userId } // Security check: Ensure user owns service
        }
    );

    if (updatedRows > 0) {
        const updatedService = await Service.findByPk(serviceId);
        res.status(200).json(updatedService);
        sendServiceUpdated(updatedService); // Broadcast the change
    } else {
        res.status(404).json({ 
            message: 'Service not found or user is not authorized to update this service.' 
        });
    }

  } catch (error) {
    console.error('Error updating availability window:', error);
    // Note: If error.errors exists, it's a Sequelize validation error
    const message = error.errors ? error.errors[0].message : error.message; 
    res.status(500).json({ message: message });
  }
};

// Delete a service
exports.deleteService = async (req, res) => {
  try {
    const service = await Service.findByPk(req.params.id);
    if (!service || service.userId !== req.user.id) { // Ensure user owns the service
      return res.status(404).json({ message: 'Service not found or unauthorized' });
    }
    const deletedRows = await Service.destroy({
      where: { id: req.params.id },
    });
    if (deletedRows > 0) {
      res.status(204).send();
      sendServiceDeleted(service.id, service.userId);
    } else {
      res.status(404).json({ message: 'Service not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};