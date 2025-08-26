const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Chatroom = require('./chatroom');
const User = require('./user');

const Message = sequelize.define('Message', {
  chatroomId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references:{
      model:Chatroom,
      key:'id',
    }
  },
  senderId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
        model: User,
        key: 'id',
      },
  },
  encryptedContent: {
    type: DataTypes.TEXT, // Store the *encrypted* message
    allowNull: false,
  },
  iv: { // Store the initialization vector
    type: DataTypes.TEXT,
    allowNull: false,
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
});

module.exports = Message;