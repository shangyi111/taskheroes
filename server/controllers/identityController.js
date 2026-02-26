const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { User } = require('../models');

exports.createVerificationSession = async (req, res) => {
  try {
    const userId = req.user.id; // From your authInterceptor

    // Create session on Stripe's secure infrastructure
    const session = await stripe.identity.verificationSessions.create({
      type: 'document', // Checks Passport, Driver's License, or ID Card
      metadata: { userId: userId }, // Critical for linking back in the webhook
      return_url: `${process.env.CLIENT_URL}?verified=true`
    });

    // Save the Session ID to the database for audit trails
    await User.update(
      { stripeVerificationSessionId: session.id },
      { where: { id: userId } }
    );

    res.json({ url: session.url });
  } catch (error) {
    console.error('Stripe Identity Error:', error);
    res.status(500).json({ message: 'Identity service unavailable' });
  }
};