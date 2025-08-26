const { emitToUser } = require('../socketService');

function sendJobCreated(job) {
  emitToUser(job.userId, 'job_created', job);
}

function sendJobUpdated(job) {
  emitToUser(job.userId, 'job_updated', job);
}

function sendJobDeleted(jobId, userId) {
  console.log(`Emitting to userId ${userId} with event "job_deleted" for job ${jobId}`);
  emitToUser(userId, 'job_deleted', { jobId });
}

module.exports = {
  sendJobCreated,
  sendJobUpdated,
  sendJobDeleted,
};
