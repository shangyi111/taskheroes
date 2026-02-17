const { DataTypes } = require('sequelize');
const User = require('./user');
const Service = require('./service');
const sequelize = require('../config/db');
const JobStatus = require('../constants/jobStatus');

const Job = sequelize.define('Job', {
  performerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User, 
      key: 'id',
    }, 
  },
  customerId:{
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User, 
      key: 'id',
    }, 
  },
  serviceId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: Service,
      key: 'id',
    },
  },
  jobStatus: {
    type: DataTypes.ENUM(Object.values(JobStatus)),
    defaultValue: JobStatus.PENDING, // Use the constant here
    allowNull: false
  },
  jobDescription: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  jobTitle: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  // HYBRID APPROACH: Store the full combined Date + Time here for Cron logic
  jobDate: {
    type: DataTypes.DATE, 
    allowNull: true,
  },
  // HYBRID APPROACH: Store the human-readable start time for UI display
  startTime: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  // REQUIRED FOR AUTOMATION: Duration in minutes to calculate "End Time"
  duration: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  lastActionBy: {
    type: DataTypes.INTEGER, // Match your User ID type
    allowNull: true,
    references: {
      model: User,
      key: 'id',
    },
  },
  priceBreakdown: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: [],
    validate: {
      isValidBreakdown(value) {
        if (!Array.isArray(value)) {
          throw new Error('priceBreakdown must be an array');
        }
        value.forEach(item => {
          if (!item.type || !item.label || typeof item.amount !== 'number') {
            throw new Error('Each breakdown item must have a type, label, and numeric amount');
          }
        });
      }
    }
    // Example storage: 
    // [
    //   {"type":"base","label": "Service Fee", "amount": 300}, 
    //   {"type":"custom","label": "Travel Fee", "amount": 50}
    // ]
  },
  hourlyRate:{
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  zipCode:{
    type:DataTypes.INTEGER,
    allowNull:true,
  },
  location: {
    type: DataTypes.STRING,
    allowNull: true,
  },
});

module.exports = Job;