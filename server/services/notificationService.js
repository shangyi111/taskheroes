const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

// Define your verified "From" email as a constant here
const FROM_EMAIL = 'TaskHeroes <info@task-heroes.org>';

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
  async sendJobNotification(recipientEmail, jobTitle, role) {
    const subject = role === 'provider' ? 'New Job Request!' : 'Job Request Submitted';
    return await resend.emails.send({
      from: FROM_EMAIL,
      to: recipientEmail,
      subject: subject,
      html: `<p>Your job <strong>${jobTitle}</strong> has a new update.</p>`
    });
  },

  // 3. Job Status Updates (e.g., 'Accepted', 'Completed')
  async sendStatusUpdate(userEmail, jobTitle, newStatus) {
    return await resend.emails.send({
      from: FROM_EMAIL,
      to: userEmail,
      subject: `Update: ${jobTitle} is now ${newStatus}`,
      html: `<p>The status of your job <strong>${jobTitle}</strong> has changed to <strong>${newStatus}</strong>.</p>`
    });
  }
};

module.exports = NotificationService;