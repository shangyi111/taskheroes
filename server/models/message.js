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
  attachmentUrl: {
    type: DataTypes.STRING,
    allowNull: true, // Nullable because most messages are just text
  },
  attachmentType: {
    type: DataTypes.STRING, // e.g., 'image' or 'document'
    allowNull: true,
  },
  attachmentName: {
    type: DataTypes.STRING, // e.g., 'plumbing_quote.pdf'
    allowNull: true,
  },
});

module.exports = Message;