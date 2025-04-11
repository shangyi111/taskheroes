const express = require('express');
const router = express.Router();
const servicesController = require('../controllers/servicesController');
const authMiddleware = require('../auth/authMiddleware');

// Get all services
router.get('/', servicesController.getAllServices);

// Get a specific service by ID
router.get('/:id', servicesController.getServiceById);

// Create a new service (protected)
router.post('/', authMiddleware, servicesController.createService);

// Update a service (protected)
router.put('/:id', authMiddleware, servicesController.updateService);

// Delete a service (protected)
router.delete('/:id', authMiddleware, servicesController.deleteService);

module.exports = router;