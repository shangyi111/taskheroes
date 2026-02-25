const JobStatus = {
  PENDING: 'pending',        // Initial request from seeker
  ACCEPTED: 'accepted',      // Provider says "I'm available/Price is right"
  BOOKED: 'booked',    
  IN_PROGRESS: 'inProgress',      // MUTUAL CONFIRMATION: Handshake complete, calendar blocked
  COMPLETED: 'completed',    // Service rendered; review window opens
  EXPIRED: 'expired',        // No mutual confirmation within 48 hours
  CANCELLED_BY_SEEKER: 'cancelledBySeeker',
  CANCELLED_BY_PROVIDER: 'cancelledByProvider'
};

module.exports = JobStatus;