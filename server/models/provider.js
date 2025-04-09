const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Provider = sequelize.define('Provider', {
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users', // Assuming your user table is named 'Users'
      key: 'id',
    }, // A user can have more than one provider profile
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
  // Add other provider-related fields as needed
});

module.exports = Provider;