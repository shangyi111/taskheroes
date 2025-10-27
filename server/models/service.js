const { DataTypes } = require('sequelize');
const User = require('./user');
const sequelize = require('../config/db');

const Service = sequelize.define('Service', {
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User, 
      key: 'id', 
    }, 
  },
  businessName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  businessAddress: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  phoneNumber: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  profilePicture: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  category: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  hourlyRate:{
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  availabilityWindowDays: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 90,
  },
});
  
module.exports = Service;