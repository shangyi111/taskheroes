const { emitToUser } = require('../socketService');

function sendReviewCreated(review) {
  emitToUser(review.userId, 'review_created', review);
}

function sendReviewUpdated(review) {
  emitToUser(review.userId, 'review_updated', review);
}

function sendReviewDeleted(reviewId, userId) {
  emitToUser(userId, 'review_deleted', { reviewId });
}

module.exports = {
  sendReviewCreated,
  sendReviewUpdated,
  sendReviewDeleted,
};
