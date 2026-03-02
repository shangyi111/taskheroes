const express = require('express');
const router = express.Router();
const stripeWebhookController = require('../controllers/stripeWebhookController');

// We use express.raw so the controller can verify the signature
router.post('/stripe', express.raw({ type: 'application/json' }), stripeWebhookController.handleStripeWebhook);

module.exports = router;