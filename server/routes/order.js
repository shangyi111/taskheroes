const express = require('express');
const router = express.Router();
const jobsController = require('../controllers/jobsController');
const authMiddleware = require('../auth/authMiddleware');

// Get all jobs
router.get('/', jobsController.getAllJobs);

// Get a specific order by customerId
router.get('/seeker/:id', jobsController.getJobsByCustomerId);

// Create a new job (protected)
router.post('/', authMiddleware, jobsController.createJob);

// Update a job (protected)
router.put('/:id', authMiddleware, jobsController.updateJob);

// Delete a job (protected)
router.delete('/:id', authMiddleware, jobsController.deleteOrderByCustomerId);

module.exports = router;