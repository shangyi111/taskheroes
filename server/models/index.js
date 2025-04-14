const User = require('./user');
const Job = require('./job');
const Service = require('./service');
const Review = require('./review');
const Chatroom = require('./chatroom');
const ChatroomUser = require('./chatroomuser');
const Message = require('./message');

// Define associations
Chatroom.belongsToMany(User, { through: ChatroomUser });
Chatroom.hasMany(Message);
Message.belongsTo(Chatroom);
Message.belongsTo(User, { foreignKey: 'senderId' });
Service.belongsTo(User, { foreignKey: 'userId' });
Service.hasMany(Review, {foreignKey: 'serviceId'});
Service.hasMany(Job, {foreignKey: 'serviceId'});
Review.belongsTo(User, { foreignKey: 'userId' });
Review.belongsTo(Job, { foreignKey: 'jobId' });
Job.hasOne(Review,{foreignKey:'jobId'});
Job.hasOne(Service,{foreignKey:'serviceId'});
User.hasMany(Service, {foreignKey: 'userId'});
User.hasMany(Job, {foreignKey: 'userId'});
User.hasMany(Review,{foreignKey:'userId'});
User.belongsToMany(Chatroom, { through: ChatroomUser });


module.exports = {
    User,
    Job,
    Service,
    Review,
    Chatroom,
    ChatroomUser,
    Message,
};