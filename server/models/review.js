const { DataTypes } = require('sequelize');
const User = require('./user');
const Job = require('./job');
const Service = require('./service');
const sequelize = require('../config/db');

const Review = sequelize.define('Review', {
  isPublished: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  revieweeId: {
    type: DataTypes.INTEGER, // Assuming revieweeId refers to a service or user ID
    allowNull: true, // Reviewee might not be known initially
    references: {
      model: User, 
      key: 'id', 
    },
  },
  reviewerId: {
    type: DataTypes.INTEGER, // Assuming reviewerId refers to a User id
    allowNull: true, // Reviewer might not be known initially
    references: {
      model: User,
      key: 'id',
    },
  },
  jobId:{
    type: DataTypes.INTEGER, // Assuming reviewerId refers to a User id
    allowNull: true, // Reviewer might not be known initially
    references: {
      model: Job,
      key: 'id',
    },
  },
  serviceId:{
    type: DataTypes.INTEGER, 
    allowNull: true, 
    references: {
      model: Service,
      key: 'id',
    },
  },
  //overall feedback
  rating: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 1,
      max: 5,
    },
  },
  comment: { type: DataTypes.TEXT },
  communication: { type: DataTypes.INTEGER, validate: { min: 1, max: 5 } },
  // --- SEEKER Criteria (About Provider) ---
  professionalism: { type: DataTypes.INTEGER, validate: { min: 1, max: 5 } },
  wasOnTime: { type: DataTypes.BOOLEAN, defaultValue: true },

  // --- PROVIDER Criteria (About Seeker) ---
  isFullAmountPaid: { type: DataTypes.BOOLEAN, defaultValue: true },
  isPaidWithin24h: { type: DataTypes.BOOLEAN, defaultValue: false },
  wouldRecommend: { type: DataTypes.BOOLEAN, defaultValue: true },
  //Role metadata
  reviewerRole: { type: DataTypes.ENUM('seeker', 'provider'), allowNull: false },
  addedDate:{
    type:DataTypes.DATE,
    allowNull:true,
  },
  
});

module.exports = Review;