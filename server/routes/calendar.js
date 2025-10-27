const express = require('express');
const router = express.Router();
const calendarController = require('../controllers/calendarsController'); 

// GET /api/calendar/providers/:providerId/service/:serviceId
router.get('/provider/:providerId/service/:serviceId', calendarController.getCalendar);

// POST /api/calendar/providers/:providerId/service/:serviceId
router.post('/provider/:providerId/service/:serviceId', calendarController.updateCalendar);

module.exports = router;