const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

// Define your verified "From" email as a constant here
const FROM_EMAIL = 'TaskHeroes <info@task-heroes.org>';
const APP_URL = process.env.NODE_ENV === 'production' 
  ? 'https://task-heroes.org' 
  : 'http://localhost:4200';

const NotificationService = {
  // 1. Sign Up
  async sendWelcomeEmail(user) {
    return await resend.emails.send({
      from: FROM_EMAIL,
      to: user.email,
      subject: `Welcome to TaskHeroes, ${user.username}!`,
      html: `<h1>Welcome!</h1><p>Thanks for joining. Start by browsing jobs near you.</p>`
    });
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
  
    try {
        const data = await resend.emails.send({
        from: FROM_EMAIL,
        to: userEmail,
        subject: `Update: ${jobTitle} is now ${newStatus}`,
        html: `
            <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
            <h2 style="color: #333;">Job Status Update</h2>
            <p>The status of your job <strong>${jobTitle}</strong> has changed to <span style="font-weight: bold; color: #007bff;">${newStatus}</span>.</p>
            <div style="margin-top: 20px;">
                <a href="${actionUrl}" style="background-color: #007bff; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Log in to check Progress
                </a>
            </div>
            </div>
        `
        });

        console.log(`✅ Email sent successfully to ${userEmail} for Job #${jobId}`);
        return data;

    } catch (error) {
        // This will catch API Key issues, Network issues, and Resend errors
        console.error(`❌ Failed to send status update email to ${userEmail}:`, {
        jobId: jobId,
        status: newStatus,
        errorMessage: error.message,
        stack: error.stack // Useful for debugging in VS Code
        });

        return null; 
    }
  }
};

module.exports = NotificationService;