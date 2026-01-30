const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);
const { Job, User } = require('../models');

// Define your verified "From" email as a constant here
const FROM_EMAIL = 'TaskHeroes <info@task-heroes.org>';
const APP_URL = process.env.NODE_ENV === 'production' 
  ? 'https://task-heroes.org' 
  : 'http://localhost:4200';

const NotificationService = {

  async sendEmail(to, subject, htmlContent) {
    try {
        const data = await resend.emails.send({
            from: FROM_EMAIL,
            to: to,
            subject: subject,
            html: htmlContent
        });
        return data;
    } catch (error) {
        console.error(`❌ Resend Error [To: ${to}]:`, error.message);
        return null;
    }
  },
  // 1. Sign Up
  async sendWelcomeEmail(user) {
    const html = `<h1>Welcome!</h1><p>Thanks for joining, ${user.username}. Start by browsing jobs near you.</p>`;
    return await this.sendEmail(user.email, `Welcome to TaskHeroes!`, html);
  },

  // 2. Job Request Submitted/Received
  async sendJobNotification(recipientEmail, jobTitle, role, jobId) {
    const subject = role === 'provider' ? 'New Job Request!' : 'Job Request Submitted';
    const actionUrl = `${APP_URL}/jobs/${jobId}`;
    return await resend.emails.send({
      from: FROM_EMAIL,
      to: recipientEmail,
      subject: subject,
      html: `<div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee;">
          <h2>${subject}</h2>
          <p>Your job <strong>${jobTitle}</strong> has a new update.</p>
          <a href="${actionUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 10px;">
            View Job Details
          </a>
        </div>
      `
    });
  },

  // 3. Job Status Updates (e.g., 'Accepted', 'Completed')
  async sendStatusUpdate(userEmail, jobTitle, newStatus,jobId) {
    const actionUrl = `${APP_URL}/login`;
    const html = `
      <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
        <h2 style="color: #333;">Job Status Update</h2>
        <p>The status of your job <strong>${jobTitle}</strong> has changed to <span style="font-weight: bold; color: #007bff;">${newStatus}</span>.</p>
        <a href="${actionUrl}" style="background-color: #007bff; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 20px;">
          Log in to check Progress
        </a>
      </div>`;

    const subject = `Update: ${jobTitle} is now ${newStatus}`;
  
    return await this.sendEmail(userEmail, subject, html);
  },

  // 1. Triggered when BOTH parties have finally reviewed
  async sendReviewsRevealedNotification(jobId) {
    const job = await Job.findByPk(jobId, {
      include: [
        { model: User, as: 'customer', attributes: ['email', 'username'] },
        { model: User, as: 'performer', attributes: ['email', 'username'] }
      ]
    });

    if (!job) return;

    const subject = `Reviews are now live for "${job.jobTitle}"!`;
    const text = (name) => `Hi ${name}, both you and your partner have completed your reviews. You can now see the feedback on your profile!`;

    // Send to both parties
    await Promise.all([
      this.sendEmail(job.customer.email, subject, text(job.customer.username)),
      this.sendEmail(job.performer.email, subject, text(job.performer.username))
    ]);
  },

  // 2. Triggered when only ONE party has reviewed (The "Teaser")
  async sendPromptToReview(jobId, reviewerId) {
    const job = await Job.findByPk(jobId, {
      include: [
        { model: User, as: 'customer', attributes: ['id', 'email', 'username'] },
        { model: User, as: 'performer', attributes: ['id', 'email', 'username'] }
      ]
    });

    if (!job) return;

    // We want to email the person who HAS NOT reviewed yet
    const recipient = (reviewerId === job.customerId) ? job.performer : job.customer;
    const reviewer = (reviewerId === job.customerId) ? job.customer : job.performer;

    const subject = `You are reviewed for "${job.jobTitle}"!`;
    const text = `Hi ${recipient.username}, ${reviewer.username} has left you a review. 
    To see what they said and unlock your feedback, please head over to TaskHeroes and leave your review for them!`;

    return await this.sendEmail(recipient.email, subject, text);
  }
};

module.exports = NotificationService;