const express = require('express');
const router = express.Router();
const reviewsController = require('../controllers/reviewsController');
const authMiddleware = require('../auth/authMiddleware');
const Job = require('./jobs');

// Get all reviews
router.get('/', reviewsController.getAllReviews);

// Get a specific review by ID
router.get('/:id', reviewsController.getReviewById);

// Get reviews by service Id
router.get('/service/:serviceId', reviewsController.getReviewsByServiceId);

router.get('/eligibility/:jobId', authMiddleware, async (req, res) => {
  const job = await Job.findByPk(req.params.jobId);
  const status = await reviewsController.checkReviewEligibility(job, req.user.id);
  res.json(status);
});

// Create a new review (protected)
router.post('/', authMiddleware, reviewsController.createReview);

// Update a review (protected)
router.put('/:id', authMiddleware, reviewsController.updateReview);

// Delete a review (protected) **disabled until authSet to be verified by Shangyi Chen only**
// router.delete('/:id', authMiddleware, reviewsController.deleteReview);

module.exports = router;