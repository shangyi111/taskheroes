const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const UserProfile = sequelize.define('UserProfile', {
  legalFirstName: {
    type: DataTypes.STRING,
    allowNull: false, 
  },
  legalLastName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  phoneNumber: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
});

module.exports = UserProfile;