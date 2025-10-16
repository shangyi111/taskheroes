const express = require('express');
const router = express.Router();

// In-memory "database" to hold calendar data
const calendarDB = {
  '1': {
    basePrice: 180, 
    availability: {
      '2025-10-15': { isAvailable: false, customPrice: null, status: 'unavailable' },
      '2025-10-16': { isAvailable: false, customPrice: null, status: 'booked', bookingInfo: 'Client meeting from 10am-12pm' },
      '2025-10-20': { isAvailable: true, customPrice: 200, status: 'available' },
    }
  },
  'provider456': {
    basePrice: 250,
    availability: {} // No special dates, so defaults apply
  }
};

// GET /api/calendar/providers/:providerId
router.get('/providers/:providerId', (req, res) => {
  const { providerId } = req.params;
  const { month } = req.query; // e.g., '2025-10'

  const providerData = calendarDB[providerId];

  if (!providerData) {
    return res.status(404).json({ message: 'Provider not found.' });
  }

  // Filter availability for the requested month
  const monthlyAvailability = Object.keys(providerData.availability)
    .filter(date => date.startsWith(month))
    .reduce((obj, date) => {
      obj[date] = providerData.availability[date];
      return obj;
    }, {});

  const responseData = {
    basePrice: providerData.basePrice,
    availability: monthlyAvailability
  };

  res.status(200).json(responseData);
});

// POST /api/calendar/providers/:providerId
router.post('/providers/:providerId', (req, res) => {
  const { providerId } = req.params;
  const { dates, price, availability } = req.body;

  const providerData = calendarDB[providerId];
  if (!providerData) {
    return res.status(404).json({ message: 'Provider not found.' });
  }

  // Update the in-memory database with the new changes
  dates.forEach(date => {
    providerData.availability[date] = {
      isAvailable: availability,
      customPrice: availability ? price : null
    };
  });

  res.status(200).json({ message: 'Calendar updated successfully', updatedDates: dates });
});

module.exports = router;