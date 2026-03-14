const express = require('express');
const router = express.Router();
const jobsController = require('../controllers/jobsController');
const { authenticateToken } = require('../auth/authMiddleware');

// Get a specific order by customerId
router.get('/seeker/:id', jobsController.getJobsByCustomerId);

// Create a new job (protected)
router.post('/', authenticateToken, jobsController.createJob);

// Update a job (protected)
router.put('/:id', authenticateToken, jobsController.updateJob);

// Delete a job (protected)
router.delete('/:id', authenticateToken, jobsController.deleteOrderByCustomerId);

module.exports = router;