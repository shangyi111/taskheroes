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
  stripeVerificationFingerprint: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true, 
  },
  stripeVerificationSessionId: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true, // One session per ID check
  },

  // The "Truth" flag for your Seeker Portfolio badge
  isIdentityVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },

  // Metadata for auditing and trust building
  identityVerifiedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  }
});

module.exports = User;
