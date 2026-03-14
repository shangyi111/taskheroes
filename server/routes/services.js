const express = require('express');
const router = express.Router();
const servicesController = require('../controllers/servicesController');
const searchController=require('../controllers/searchController');
const { authenticateToken, requireJobParticipant } = require('../auth/authMiddleware');


// Route for searching services with filtering (this is your new search controller)
router.get('/search', searchController.searchServices);

// Get all services
router.get('/', servicesController.getAllServices);

// Get a specific service by ID
router.get('/:id', servicesController.getServiceById);

// Create a new service (protected)
router.post('/', authenticateToken, servicesController.createService);

// Update a service (protected)
router.put('/:id', authenticateToken, servicesController.updateService);

//Update only the Availability Window for a specific service (protected)
router.put('/:id/availabilityWindow', authenticateToken, servicesController.updateAvailabilityWindow);

// Delete a service (protected)
router.delete('/:id', authenticateToken, servicesController.deleteService);

module.exports = router;