const { Calendar, Service, Job, User } = require('../models');
const { Op } = require('sequelize');

const calendarController = {
  getCalendar: async (req, res) => {
    try {
      const { providerId, serviceId } = req.params;
      const requesterId = req.user?.id;
      const isOwner = String(requesterId) === String(providerId);
      const { month } = req.query; // format: '2026-01'
      const [year, monthNum] = month.split('-');
      const startDate = `${year}-${monthNum}-01`;
      const endDate = `${year}-${monthNum}-${new Date(year, monthNum, 0).getDate()}`;

      // 1. Fetch current service details for the provider
      const currentService = await Service.findOne({
        where: { id: serviceId, userId: providerId },
        attributes: ['hourlyRate', 'availabilityWindowDays']
      });

      if (!currentService) {
        return res.status(404).json({ message: 'Service not found.' });
      }

      // 2. Fetch ALL calendar entries for this provider this month
      const allProviderData = await Calendar.findAll({
        where: {
          providerId: providerId,
          date: { [Op.gte]: startDate, [Op.lte]: endDate }
        },
        include: isOwner ? [
          {
            model: Service,
            attributes: ['businessName']
          },
          {
            model: Job,
            include: [{ 
              model: User, 
              as: 'customer', 
              attributes: ['username'] 
            }]
          }
        ] : [],
      });

      const availability = {};
      const externalConflicts = {};

      allProviderData.forEach(entry => {
        const dateKey = entry.date;
        
        if (entry.serviceId == serviceId) {
          // Availability data for the SPECIFIC service being viewed
          availability[dateKey] = {
            isAvailable: entry.isAvailable,
            status: entry.status,
            customPrice: entry.customPrice,
            ...(isOwner && { jobId: entry.jobId }) // Hide jobId from seekers
          };
        } else if (entry.status === 'booked' || !entry.isAvailable) {
          // DATA FROM OTHER SERVICES (CONFLICTS)
          // To a seeker, a conflict on another service just looks like 'unavailable'
          availability[dateKey] = {
            isAvailable: false,
            status: 'unavailable' 
          };

          // If owner, add the detailed conflict info
          if (isOwner) {
            availability[dateKey].conflictDetail = {
              serviceName: entry.Service?.businessName,
              clientName: entry.Job?.customer?.username
            };
          }
        }
      });

      res.status(200).json({ 
        basePrice: currentService.hourlyRate || 0, 
        availability, 
        isOwner,
        availabilityWindow: currentService.availabilityWindowDays || 90 
      });

    } catch (error) {
      console.error('Error fetching calendar data:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  },

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
          jobId: null,
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