const express = require('express');
const router = express.Router();
const mapController = require('../controllers/mapController'); 

// GET /api/map
router.get('/drivingTime', mapController.getDrivingTime);

module.exports = router;