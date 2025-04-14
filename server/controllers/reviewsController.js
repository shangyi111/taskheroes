const { Review } = require('../models');
const {
  sendReviewUpdated,
  sendReviewCreated,
  sendReviewDeleted,
} = require('../websocket/handlers/reviewHandler');

// Get all reviews
exports.getAllReviews = async (req, res) => {
  try {
    const reviews = await Review.findAll();
    res.json(reviews);
  } catch (error) {
    console.log("error inside get all reviews",error);
    res.status(500).json({ message: error.message });
  }
};

// Get a specific review by ID
exports.getReviewById = async (req, res) => {
  try {
    const review = await Review.findByPk(req.params.id);
    if (review) {
      res.json(review);
    } else {
      res.status(404).json({ message: 'Review not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a new review
exports.createReview = async (req, res) => {
  try {
    const newReview = await Review.create({ ...req.body, userId: req.user.id }); 
    res.status(201).json(newReview);
    sendReviewCreated(newReview);
  } catch (error) {
    const message = error.errors[0].message;
    res.status(400).json({ message });
  }
};

exports.updateReview = async (req, res) => {
  try {
    const reviewId = req.params.id;
    const [updatedRowCount] = await Review.update(req.body, {
      where: { id: reviewId, userId: req.user.id }, // Ensure user owns the review
      returning: true, // To get the updated record
    });

    if (updatedRowCount > 0) {
      const updatedReview = await Review.findByPk(reviewId);
      res.status(200).json(updatedReview);
      sendReviewUpdated(updatedReview);
    } else {
      res.status(404).json({ message: 'Review not found or unauthorized' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete a review
exports.deleteReview = async (req, res) => {
  try {
    const review = await Review.findByPk(req.params.id);
    if (!review || review.userId !== req.user.id) { // Ensure user owns the review
      return res.status(404).json({ message: 'Review not found or unauthorized' });
    }
    const deletedRows = await Review.destroy({
      where: { id: req.params.id },
    });
    if (deletedRows > 0) {
      res.status(204).send();
      sendReviewDeleted(review.id, review.userId);
    } else {
      res.status(404).json({ message: 'Review not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};