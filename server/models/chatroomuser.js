const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const ChatroomUser = sequelize.define('ChatroomUser', {
  // No additional attributes needed for the join table itself
});

module.exports = ChatroomUser;