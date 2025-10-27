const { Client } = require('@googlemaps/google-maps-services-js');
const mapsClient = new Client({}); 

const drivingTimeController = {
  getDrivingTime: async (req, res) => {
    const { origin, destination } = req.query; // origin=provider, destination=seeker

    if (!origin || !destination) {
        return res.status(400).json({ message: "Missing origin or destination." });
    }

    try {
        const response = await mapsClient.distancematrix({
            params: {
                origins: [origin],
                destinations: [destination],
                key: process.env.GOOGLE_MAPS_API_KEY,
            },
            timeout: 1000,
        });

        // 1. Extract one-way driving time in seconds
        const element = response.data.rows[0].elements[0];
        if (element.status !== 'OK') {
            return res.status(400).json({ message: "Invalid address provided." });
        }
        
        const oneWayTimeSeconds = element.duration.value; 
        const oneWayTimeMinutes = Math.ceil(oneWayTimeSeconds / 60);

        // 2. Calculate round trip time in minutes
        const roundTripTimeMinutes = oneWayTimeMinutes * 2;
        
        res.status(200).json({ roundTripTimeMinutes: roundTripTimeMinutes });

    } catch (error) {
        console.error("Google Maps API Error:", error);
        res.status(500).json({ message: "Failed to calculate driving time." });
    }
  }
};

module.exports = drivingTimeController;