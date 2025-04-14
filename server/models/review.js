const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Review = sequelize.define('Review', {
  revieweeId: {
    type: DataTypes.INTEGER, // Assuming revieweeId refers to a service or user ID
    allowNull: true, // Reviewee might not be known initially
    references: {
      model: 'User', 
      key: 'id', 
    },
  },
  reviewerId: {
    type: DataTypes.INTEGER, // Assuming reviewerId refers to a User id
    allowNull: true, // Reviewer might not be known initially
    references: {
      model: 'User',
      key: 'id',
    },
  },
  jobId:{
    type: DataTypes.INTEGER, // Assuming reviewerId refers to a User id
    allowNull: true, // Reviewer might not be known initially
    references: {
      model: 'Job',
      key: 'id',
    },
  },
  rating: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 1, // Minimum rating
      max: 5, // Maximum rating (adjust as needed)
    },
  },
  review: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  addedDate:{
    type:DataTypes.DATE,
    allowNull:true,
  }
});

module.exports = Review;