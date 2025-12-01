const express = require('express');
const router = express.Router();
const reviewsController = require('../controllers/reviewsController');
const authMiddleware = require('../auth/authMiddleware');

// Get all reviews
router.get('/', reviewsController.getAllReviews);

// Get a specific review by ID
router.get('/:id', reviewsController.getReviewById);

// Get reviews by service Id
router.get('/service/:serviceId', reviewsController.getReviewsByServiceId);

// Create a new review (protected)
router.post('/', authMiddleware, reviewsController.createReview);

// Update a review (protected)
router.put('/:id', authMiddleware, reviewsController.updateReview);

// Delete a review (protected)
router.delete('/:id', authMiddleware, reviewsController.deleteReview);

module.exports = router;