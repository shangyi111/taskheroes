const { emitToUser } = require('../socketService');

function sendJobCreated(job) {
  emitToUser(job.userId, 'job_created', job);
}

function sendJobUpdated(job) {
  emitToUser(job.userId, 'job_updated', job);
}

function sendJobDeleted(jobId, userId) {
  emitToUser(userId, 'job_deleted', { jobId });
}

module.exports = {
  sendJobCreated,
  sendJobUpdated,
  sendJobDeleted,
};
