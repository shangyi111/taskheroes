const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Job = sequelize.define('Job', {
  userId: {//performer
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'User', 
      key: 'id',
    }, 
  },
  customerId:{
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'User', 
      key: 'id',
    }, 
  },
  serviceId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Service',
      key: 'id',
    },
  },
  jobStatus: {
    type: DataTypes.ENUM('pending', 'inProgress', 'completed', 'cancelled'),
    allowNull: true,
    defaultValue: 'pending',
  },
  jobDescription: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  jobTitle: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  jobDate: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  jobPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  // Add any other relevant job fields here
});

module.exports = Job;