const { Review, Service } = require('../models');
const { Op } = require('sequelize');
const axios = require('axios'); // For geocoding

// Configuration for a geocoding service (replace with your chosen service)
const GEOCODING_API_URL = 'https://api.zippopotam.us/us/'; // Example: Zippopotam.us (for US zip codes)
// You might need an API key for other services like Google Geocoding API

exports.searchServices = async (req, res) => {
  try {
    const { category, 
        keyword, 
        minHourlyRate, 
        maxHourlyRate, 
        zipcode, 
        radius, 
        sortBy, 
        sortOrder, 
        page, 
        pageSize,excludeUserId } = req.query;

    const where = {};
    const order = [];
    const pagination = {};
    let proximityWhere = {};

    // Exclude the current user's services
    if (excludeUserId) {
        const parsedExcludeUserId = parseInt(excludeUserId); 
        where.userId = { [Op.ne]: parsedExcludeUserId };
      }

    // Filter by category
    if (category) {
        where.category = { [Op.in]: Array.isArray(category) ? category : category.split(',') };
        }

    // Keyword search
    if (keyword) {
      where[Op.or] = [
        { businessName: { [Op.iLike]: `%${keyword}%` } },
        { description: { [Op.iLike]: `%${keyword}%` } },
      ];
    }

    // Filter by hourly rate range
    if (minHourlyRate !== undefined && !isNaN(parseFloat(minHourlyRate))) {
      where.hourlyRate = { ...where.hourlyRate, [Op.gte]: parseFloat(minHourlyRate) };
    }
    if (maxHourlyRate !== undefined && !isNaN(parseFloat(maxHourlyRate))) {
      where.hourlyRate = { ...where.hourlyRate, [Op.lte]: parseFloat(maxHourlyRate) };
    }

    // Proximity search by zipcode and radius
    let latitude, longitude;
    if (zipcode && radius && !isNaN(parseFloat(radius))) {
      try {
        const geocodingResponse = await axios.get(`${GEOCODING_API_URL}${zipcode}`);
        if (geocodingResponse.data && geocodingResponse.data.places && geocodingResponse.data.places.length > 0) {
          latitude = parseFloat(geocodingResponse.data.places[0].latitude);
          longitude = parseFloat(geocodingResponse.data.places[0].longitude);

          if (!isNaN(latitude) && !isNaN(longitude)) {
            // Assuming your Service model has 'latitude' and 'longitude' fields
            const sequelize = Service.sequelize;
            const distance = sequelize.literal(
              `6371 * acos(cos(radians(${latitude})) * cos(radians(latitude)) * cos(radians(longitude) - radians(${longitude})) + sin(radians(${latitude})) * sin(radians(latitude))))`
            );

            proximityWhere = sequelize.where(distance, { [Op.lte]: parseFloat(radius) });
            order.push([distance, 'ASC']); // Order by distance
          } else {
            console.warn('Could not retrieve valid coordinates for the provided zip code.');
            // Optionally return an error or proceed without proximity filtering
          }
        } else {
          console.warn('Zip code not found or invalid response from geocoding service.');
          // Optionally return an error or proceed without proximity filtering
        }
      } catch (error) {
        console.error('Error geocoding zip code:', error);
        // Optionally return an error or proceed without proximity filtering
      }
    }

    // Sorting
    if (sortBy) {
      const sortDirection = sortOrder && sortOrder.toLowerCase() === 'desc' ? 'DESC' : 'ASC';
      order.push([sortBy, sortDirection]);
    } else if (!zipcode) {
      order.push(['createdAt', 'DESC']); // Default sorting if not proximity search
    }

    // Pagination
    const pageNumber = parseInt(page) || 1;
    const size = parseInt(pageSize) || 10;
    const offset = (pageNumber - 1) * size;
    pagination.limit = size;
    pagination.offset = offset;

    const { count, rows: services } = await Service.findAndCountAll({
      where: { [Op.and]: [where, proximityWhere] },
      order,
      ...pagination,
      include: [{ model: Review }],
    });

    res.status(200).json({
      totalItems: count,
      totalPages: Math.ceil(count / size),
      currentPage: pageNumber,
      pageSize: size,
      services,
      ...(latitude && longitude && { searchCoordinates: { latitude, longitude } }), // Optionally return search coordinates
    });

  } catch (error) {
    console.error('Error searching services:', error);
    res.status(500).json({ message: 'Failed to search services', error: error.message });
  }
};