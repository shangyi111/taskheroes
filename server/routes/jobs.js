const express = require('express');
const router = express.Router();
const jobsController = require('../controllers/jobsController');
const { authenticateToken, requireJobParticipant } = require('../auth/authMiddleware');

// Get a job by job id
router.get('/:id', authenticateToken, requireJobParticipant, jobsController.getJobById);

// Get a specific job by provider userId
router.get('/provider/:id', authenticateToken, requireJobParticipant,jobsController.getJobsByPerformerId);

// Create a new job (protected)
router.post('/', authenticateToken, jobsController.createJob);

// Update a job (protected)
router.put('/:id', authenticateToken, requireJobParticipant, jobsController.updateJob);

//Updatea a job's status(protected)
router.put('/:id/status', authenticateToken, requireJobParticipant, jobsController.updateJobStatus);

// Delete a job (protected)
router.delete('/provider/:id', authenticateToken, jobsController.deleteOrderByPerformerId);

module.exports = router;