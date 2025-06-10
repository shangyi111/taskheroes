const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const User = require('./user');

const Message = sequelize.define('Message', {
  chatroomId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  senderId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
        model: User,
        key: 'id',
      },
  },
  messageText: {
    type: DataTypes.TEXT, // Store the *encrypted* message
    allowNull: false,
  },
  iv: { // Store the initialization vector
    type: DataTypes.STRING,
    allowNull: false,
  },
  timestamp: { // Add a timestamp
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
});

module.exports = Message;