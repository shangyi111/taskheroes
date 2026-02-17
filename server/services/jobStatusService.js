const JobStatus = require('../constants/jobStatus');
const { sendJobUpdated } = require('../websocket/handlers/jobHandler');

/**
 * Reconciles the status of a single job based on the current time.
 * This is "Lazy Evaluation"—we fix the status when the data is accessed.
 */
exports.reconcileJobStatus = async (job) => {
  if (!job) return null;

  const now = new Date();
  let hasChanged = false;

  // 1. AUTO-START: Booked -> In Progress
  if ((job.jobStatus === JobStatus.BOOKED || job.jobStatus === JobStatus.ACCEPTED) && new Date(job.jobDate) <= now) {
    job.jobStatus = JobStatus.IN_PROGRESS;
    hasChanged = true;
  }

  // 2. AUTO-COMPLETE: In Progress -> Completed
  if (job.jobStatus === JobStatus.IN_PROGRESS || job.jobStatus === JobStatus.BOOKED
    || job.jobStatus === JobStatus.ACCEPTED
  ) { // Also check BOOKED in case it was never updated to IN_PROGRESS
    // Calculate end time: Start Date + (duration in minutes)
    const endTime = new Date(new Date(job.jobDate).getTime() + (job.duration || 0) * 60000);
    if (endTime <= now) {
      job.jobStatus = JobStatus.COMPLETED;
      hasChanged = true;
    }
  }

  // 3. AUTO-CANCEL: Pending -> Cancelled (If the date has passed)
  // This handles requests that were never accepted/declined
  if (job.jobStatus === JobStatus.PENDING && new Date(job.jobDate) < now) {
    job.jobStatus = JobStatus.CANCELLED;
    job.statusNote = "[System] Request expired.";
    hasChanged = true;
  }

  if (hasChanged) {
    await job.save();
    sendJobUpdated(job); // Sync the UI via Socket
  }

  return job;
};