function sendReviewCreated(review) {
  const { emitToUser } = require('../socketService');
  emitToUser(review.reviewerId, 'review_created', review);
}

function sendReviewUpdated(review) {
  const { emitToUser } = require('../socketService');
  emitToUser(review.reviewerId, 'review_updated', review);
}

function sendReviewDeleted(reviewId, userId) {
  const { emitToUser } = require('../socketService');
  emitToUser(userId, 'review_deleted', { reviewId });
}

module.exports = {
  sendReviewCreated,
  sendReviewUpdated,
  sendReviewDeleted,
};
