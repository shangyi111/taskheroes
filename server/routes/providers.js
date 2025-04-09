const express = require('express');
const router = express.Router();
const providersController = require('../controllers/providersController');
const authMiddleware = require('../auth/authMiddleware');

// Get all providers
router.get('/', providersController.getAllProviders);

// Get a specific provider by ID
router.get('/:id', providersController.getProviderById);

// Create a new provider (protected)
router.post('/', authMiddleware, providersController.createProvider);

// Update a provider (protected)
router.put('/:id', authMiddleware, providersController.updateProvider);

// Delete a provider (protected)
router.delete('/:id', authMiddleware, providersController.deleteProvider);

module.exports = router;