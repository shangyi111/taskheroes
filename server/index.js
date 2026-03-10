const dotenv = require('dotenv');
dotenv.config(); // Load environment variables FIRST
const express = require('express');
const http = require('http');
const bodyParser = require('body-parser');
const authRoutes = require('./auth/authRoutes');
const contactRotues = require('./routes/contact');
const servicesRoutes = require('./routes/services');
const reviewsRoutes = require('./routes/reviews');
const jobsRoutes = require('./routes/jobs');
const orderRoutes = require('./routes/order');
const userRoutes = require('./routes/users');
const messageRoutes = require('./message-server/routes/message');
const chatroomRoutes = require('./message-server/routes/chatroom');
const calendarRoutes = require('./routes/calendar');
const portfolioRoutes = require('./routes/portfolio');
const webhookRoutes = require('./routes/webhook');
const identityRoutes = require('./routes/identity');
const mapRoutes = require('./routes/map');
const websocket = require('./websocket/socketServer');
const sequelize = require('./config/db');
const models = require('./models');
const cors = require('cors'); 

const app = express();
const PORT = process.env.PORT || 3000;

app.use('/api/webhooks', webhookRoutes);
app.use(cors());
app.use(bodyParser.json());
app.use('/api/auth', authRoutes); // Use the authentication routes
app.use('/api/service', servicesRoutes);
app.use('/api/contact',contactRotues);
app.use('/api/review', reviewsRoutes);
app.use('/api/job',jobsRoutes);
app.use('/api/order',orderRoutes);
app.use('/api/message', messageRoutes);
app.use('/api/chatroom',chatroomRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/map',mapRoutes);
app.use('/api/user',userRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/identity', identityRoutes);

// require('./cron/jobAutomations');

// Create the HTTP server instance
const server = http.createServer(app);

// Start the WebSocket server, passing the HTTP server instance
websocket.init(server);
// Use Sequelize to sync the models and then start the server
sequelize.sync() // This will sync your models with the database
  .then(() => {
    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log('Database models synced successfully.');
    });
  })
  .catch((err) => {
    console.error('Error syncing database models:', err);
  });