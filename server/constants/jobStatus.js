const JobStatus = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  DEPOSIT_SENT: 'depositSent',
  DEPOSIT_RECEIVED: 'depositReceived',
  BOOKED: 'booked',
  IN_PROGRESS: 'inProgress',
  COMPLETED: 'completed',//review invites sent at completion
  VERIFIED: 'verified',//probably not needed
  CANCELLED: 'cancelled'
};

module.exports = JobStatus;