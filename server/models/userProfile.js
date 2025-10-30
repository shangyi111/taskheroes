const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const UserProfile = sequelize.define('UserProfile', {
  phoneNumber: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  permanentAddressStreet: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  permanentAddressCity: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  permanentAddressZip: {
    type: DataTypes.STRING(10),
    allowNull: true,
  },
});

module.exports = UserProfile;