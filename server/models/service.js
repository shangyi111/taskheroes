const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Service = sequelize.define('Service', {
    providerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Providers',
        key: 'id',
      },
    },
    serviceName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    serviceDescription: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    category: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  });
  
  module.exports = Service;