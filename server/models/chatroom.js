const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Chatroom = sequelize.define('Chatroom', {
  chatroomName: { type: DataTypes.STRING, allowNull: true },
  isGroupChat: { type: DataTypes.BOOLEAN, defaultValue: false },
});

module.exports = Chatroom;