const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const RatingReview = sequelize.define('RatingReview', {
    providerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Providers',
        key: 'id',
      },
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id',
      },
    },
    rating: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 5,
      },
    },
    reviewText: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    reviewDate: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    // Add other review-related fields as needed
  });

module.exports = RatingReview;