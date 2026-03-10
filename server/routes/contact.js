const express = require('express');
const router = express.Router();
const NotificationService = require('../services/notificationService'); 

// POST /api/contact
router.post('/', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    // Basic validation to ensure no blank forms get through
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    // Call your shiny new NotificationService method
    await NotificationService.sendContactUsEmail(name, email, subject, message);

    // Tell the frontend it worked!
    return res.status(200).json({ message: 'Message sent successfully!' });

  } catch (error) {
    console.error('Contact form error:', error);
    return res.status(500).json({ message: 'Failed to send message.' });
  }
});

module.exports = router;