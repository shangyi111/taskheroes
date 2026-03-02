const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { User } = require('../models');
const { Op } = require('sequelize');
const crypto = require('crypto');


function generateSyntheticFingerprint(doc) {
  // We use components that are unlikely to change: 
  // Name + Birth Date + Issuing Country
  const components = [
    doc.first_name?.toLowerCase().trim(),
    doc.last_name?.toLowerCase().trim(),
    doc.issued_date?.year,
    doc.issued_date?.month,
    doc.issued_date?.day,
    doc.issuing_country?.toUpperCase().trim()
  ].join('|');

  return crypto.createHash('sha256').update(components).digest('hex');
}
exports.handleStripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error(`Webhook Signature Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  const session = event.data.object;
  const userId = session.metadata?.userId;

  if (!userId) {
    return res.json({ received: true, message: 'No userId in metadata' });
  }

  switch (event.type) {
    case 'identity.verification_session.verified': {
      const fullSession = await stripe.identity.verificationSessions.retrieve(session.id, {
        expand: ['last_verification_report']
      });

      const doc = fullSession.last_verification_report.document;
      const syntheticFingerprint = generateSyntheticFingerprint(doc);

      const existingUser = await User.findOne({ 
        where: { 
          stripeVerificationFingerprint: syntheticFingerprint,
          id: { [Op.ne]: userId }
        } 
      });

      if (existingUser) {
        console.warn(`Fraud Alert: User ${userId} used an ID already linked to ${existingUser.id}`);
        // We set verified to false but keep the fingerprint for your audit records
        return res.json({ 
            received: true,
            error:"Id has been verified by another user already."
        });
      }

      await User.update({ 
        isIdentityVerified: true,
        identityVerifiedAt: new Date(),
        stripeVerificationFingerprint: syntheticFingerprint,
      }, { where: { id: userId } });

      console.log(`✅ User ${userId} verified successfully.`);
      break;
    }

    case 'identity.verification_session.requires_input': {
      // 🟢 The "Fix-it" State: User needs to try again
      const error = session.last_error;
      console.log(`⚠️ User ${userId} needs input: ${error?.code}`);

      await User.update({ 
        isIdentityVerified: false,
        identityVerifiedAt: null,
        stripeVerificationFingerprint: null,
      }, { where: { id: userId } });
      break;
    }

    case 'identity.verification_session.processing': {
      // 🟢 The "Waiting" State: User has submitted documents
      console.log(`⏳ User ${userId} is being processed by Stripe AI...`);

      await User.update({ 
        isIdentityVerified: false,
        identityVerifiedAt: null,
        stripeVerificationFingerprint: null,
      }, { where: { id: userId } });
      break;
    }
  }

  res.json({ received: true });
};