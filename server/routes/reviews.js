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

// Public: Anyone can see the reputation of a seeker or provider
router.get('/reviewee/:revieweeId', authMiddleware, reviewsController.getReviewsByRevieweeId);

// Private/Public: Reviewer's own activity history
router.get('/reviewer/:reviewerId', authMiddleware, reviewsController.getReviewsByReviewerId);

// Delete a review (protected) **disabled until authSet to be verified by Shangyi Chen only**
// router.delete('/:id', authMiddleware, reviewsController.deleteReview);

module.exports = router;