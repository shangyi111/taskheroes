const express = require('express');
const router = express.Router();
const jobsController = require('../controllers/jobsController');
const authMiddleware = require('../auth/authMiddleware');

// Get all jobs
router.get('/', jobsController.getAllJobs);

// Get a job by job id
router.get('/:id', jobsController.getJobById);

// Get a specific job by provider userId
router.get('/provider/:id', jobsController.getJobsByPerformerId);

// Create a new job (protected)
router.post('/', authMiddleware, jobsController.createJob);

// Update a job (protected)
router.put('/:id', authMiddleware, jobsController.updateJob);

// Delete a job (protected)
router.delete('/provider/:id', authMiddleware, jobsController.deleteOrderByPerformerId);

module.exports = router;