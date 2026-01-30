/**
 * Factory function to ensure backend parity with 
 * the Angular 'ReviewEligibility' interface.
 */
const reviewEligibility = ({
  allowed = false,
  isExpired = false,
  hasReviewed = false,
  daysRemaining = 0
} = {}) => ({
  allowed,
  isExpired,
  hasReviewed,
  daysRemaining
});

module.exports = {
  reviewEligibility
};