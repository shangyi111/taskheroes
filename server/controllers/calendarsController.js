const { Calendar, Service, Job } = require('../models');
const { Op } = require('sequelize');

const calendarController = {
  // GET /api/calendar/providers/:providerId
  getCalendar: async (req, res) => {
    try {
      const { providerId, serviceId } = req.params;
      const { month } = req.query; 
      const [year, monthNum] = month.split('-');

      // 1. Fetch the provider's base price from the Service model
      const service = await Service.findOne({
        where: { id: serviceId, userId: providerId },
        attributes: ['hourlyRate','availabilityWindowDays']
      });

      if (!service) {
        return res.status(404).json({ message: 'Service not found for this provider.' });
      }
      const availabilityWindow = service.availabilityWindowDays || 90;
      const basePrice = service.hourlyRate || 0; // Use 0 as fallback if hourlyRate is null

      // 2. Find all availability entries for the given provider, service, and month
      const availability = await Calendar.findAll({
        where: {
          providerId: providerId,
          serviceId: serviceId,
          date: {
            [Op.gte]: `${year}-${monthNum}-01`,
            [Op.lte]: `${year}-${monthNum}-${new Date(year, monthNum, 0).getDate()}`
          }
        },
        raw: true
      });

      // 3. Format the availability data for the frontend
      const formattedAvailability = availability.reduce((acc, entry) => {
        const dateKey = entry.date;
        acc[dateKey] = {
          isAvailable: entry.isAvailable,
          status: entry.status,
          jobId: entry.jobId,
          customPrice: entry.customPrice
        };
        return acc;
      }, {});

      // The frontend expects basePrice and a dictionary of availability
      res.status(200).json({ basePrice, availability: formattedAvailability, availabilityWindow });

    } catch (error) {
      console.error('Error fetching calendar data:', error);
      res.status(500).json({ message: 'Error fetching calendar data', error: error.message });
    }
  },

  // POST /api/calendar/providers/:providerId/service/:serviceId
  updateCalendar: async (req, res) => {
    try {
      const { providerId,serviceId } = req.params;
      const { dates, price, availability} = req.body; 

      // 1. Prepare updates for Sequelize
      const updates = dates.map(date => {
        const status = availability ? 'available' : 'unavailable';
        return {
          providerId,
          serviceId,
          date,
          isAvailable: availability,
          status,
          jobId: null, // Clear jobId when setting availability/price (unless it's a booking update)
          customPrice: availability ? price : null
        };
      });

      // 2. Perform a bulk UPSERT (Update OR Insert) operation
      await Calendar.bulkCreate(updates, {
        updateOnDuplicate: ['isAvailable', 'status', 'jobId', 'customPrice', 'updatedAt']
      });

      res.status(200).json({ message: 'Calendar updated successfully', updatedDates: dates });

    } catch (error) {
      console.error('Error updating calendar data:', error);
      res.status(500).json({ message: 'Error updating calendar data', error: error.message });
    }
  }
};

module.exports = calendarController;