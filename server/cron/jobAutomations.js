const cron = require('node-cron');
const { Job, User, Review} = require('../models');
const JobStatus = require('../constants/jobStatus');
const { Op } = require('sequelize');
const { sendJobUpdated} = require('../websocket/handlers/jobHandler');
const NotificationService = require('../services/notificationService');

// Runs every minute
cron.schedule('* * * * *', async () => {
  const now = new Date();

  try {
    // 1. AUTO-START: Move 'booked' to 'inProgress' when time hits
    const jobsToStart = await Job.findAll({
      where: {
        jobStatus: JobStatus.BOOKED,
        jobDate: { [Op.lte]: now } // jobDate is now or in the past
      }
    });

    for (const job of jobsToStart) {
      job.jobStatus = JobStatus.IN_PROGRESS;
      await job.save();
      // Optional: sendJobUpdated(job) via Socket to update the chat UI live
      sendJobUpdated(job);

      // Notify Seeker to Verify and Pay/Review
        if (job.customer && job.customer.email) {
            await NotificationService.sendStatusUpdate(
            job.customer.email, 
            job.jobTitle, 
            'COMPLETED', 
            job.id
            );
        }
    }

    // 2. AUTO-COMPLETE: Move 'inProgress' to 'completed' after duration
    // Logic: jobDate + duration (minutes) <= now
    const jobsToComplete = await Job.findAll({
      where: {
        jobStatus: JobStatus.IN_PROGRESS,
        // Using Sequelize's literal to calculate the end time
        // This assumes 'duration' is a column in your Job table (in minutes)
      }
    });

    // A simpler way if duration isn't a DB column yet:
    for (const job of jobsToComplete) {
      const endTime = new Date(job.jobDate.getTime() + job.duration * 60000);
      if (endTime <= now) {
        job.jobStatus = JobStatus.COMPLETED;
        await job.save();
        sendJobUpdated(job);
        
        // TRIGGER: Notify Seeker to Verify
        //NotificationService.sendRatingInvite(job.Customer.email, job.jobTitle, 'customer', job.id);
      }
    }
  } catch (err) {
    console.error('Cron Error:', err);
  }
});

// Run every night at midnight
cron.schedule('0 0 * * *', async () => {
  const tenDaysAgo = new Date();
  tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

  try {
    // 1. Find all Jobs that were completed/verified more than 10 days ago
    // and haven't had their reviews "locked/published" yet.
    const expiredJobs = await Job.findAll({
      where: {
        jobStatus: { [Op.in]: ['completed', 'verified'] },
        jobDate: { [Op.lte]: tenDaysAgo }
      },
      attributes: ['id']
    });

    if (expiredJobs.length > 0) {
      const jobIds = expiredJobs.map(j => j.id);

      // 2. Flip isPublished for any existing reviews for these jobs
      await Review.update(
        { isPublished: true }, 
        { where: { jobId: { [Op.in]: jobIds }, isPublished: false } }
      );
      
      console.log(`Successfully closed the review window for ${jobIds.length} jobs.`);
    }
  } catch (error) {
    console.error('Error in Review Reveal Cron:', error);
  }
});