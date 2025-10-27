const { DataTypes } = require('sequelize');
const User = require('./user');
const Service = require('./service');
const Job = require('./job');
const sequelize = require('../config/db');


const Calendar = sequelize.define('Calendar', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    providerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: 'id'
      }
    },
    serviceId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Service,
        key: 'id'
      }
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    isAvailable: {
      type: DataTypes.BOOLEAN,
      allowNull: false
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'available'
    },
    jobId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: Job,
        key: 'id'
      }
    },
    customPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    }
  }, {
    tableName: 'calendar_availability',
    timestamps: true
  });

module.exports = Calendar;