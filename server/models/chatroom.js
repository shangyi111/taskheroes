const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const User = require('./user'); 
const Job = require('./job');

const Chatroom = sequelize.define('Chatroom', {
  jobId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Job,
      key: 'id',
    },
  },
  customerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id',
    },
  },
  providerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id',
    },
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
  lastActivityAt: { 
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  lastReadByCustomer: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  lastReadByProvider: {
    type: DataTypes.DATE,
    allowNull: true,
  },
});

module.exports = Chatroom;
