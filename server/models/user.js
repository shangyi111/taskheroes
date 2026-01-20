const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const User = sequelize.define('User', {
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  username:{
    type:DataTypes.STRING,
    allowNull:false,
  },
  profilePicture: {
    type: DataTypes.STRING,
    allowNull: true,
  },
});

module.exports = User;
