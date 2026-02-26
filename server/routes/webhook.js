const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { User } = require('../models');

exports.handleStripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Inside your handleStripeWebhook
if (event.type === 'identity.verification_session.verified') {
    const session = event.data.object;
    const userId = session.metadata.userId;
    
    // Stripe provides a 'hash' or fingerprint of the verified ID
    const documentFingerprint = session.last_error?.source || session.id; 

    // 1. Check if this ID is already linked to ANOTHER user
    const existingUser = await User.findOne({ 
      where: { 
        stripeVerificationFingerprint: documentFingerprint,
        id: { [Op.ne]: userId }
      } 
    });

    if (existingUser) {
      console.error(`Alert: User ${userId} tried to use an ID already linked to User ${existingUser.id}`);
      // Handle as a potential fraud case
      return res.status(400).json({ message: "This identity is already verified on another account." });
    }
  }

  res.json({ received: true });
};