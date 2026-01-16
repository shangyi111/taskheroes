const User = require('./user');
const Job = require('./job');
const UserProfile = require('./userProfile');
const Service = require('./service');
const Review = require('./review');
const Chatroom = require('./chatroom');
const ChatroomUser = require('./chatroomuser');
const Message = require('./message');
const Calendar = require('./calendar');

// Define associations
User.hasOne(UserProfile, {
    foreignKey: 'userId',
    onDelete: 'CASCADE' 
});
UserProfile.belongsTo(User, {
    foreignKey: 'userId'
});
Calendar.belongsTo(User, { foreignKey: 'providerId' });
Calendar.belongsTo(Service, { foreignKey: 'serviceId' });
Calendar.belongsTo(Job, { foreignKey: 'jobId' });
User.hasMany(Calendar, { foreignKey: 'providerId' });
Service.hasMany(Calendar, { foreignKey: 'serviceId' });
Job.hasOne(Calendar, { foreignKey: 'jobId' });
Chatroom.belongsTo(User, { foreignKey: 'customerId', as: 'Customer' });
Chatroom.belongsTo(User, { foreignKey: 'providerId', as: 'Provider' });
Chatroom.belongsTo(Job, { foreignKey: 'jobId', as: 'Job' });
Chatroom.belongsToMany(User, { through: ChatroomUser });
Chatroom.hasMany(Message, {foreignKey:'chatroomId'});
Message.belongsTo(Chatroom, { foreignKey:'chatroomId'});
Message.belongsTo(User, { as: 'sender', foreignKey: 'senderId' });
Service.belongsTo(User, { foreignKey: 'userId' });
Service.hasMany(Review, {foreignKey: 'serviceId'});
Service.hasMany(Job, {foreignKey: 'serviceId'});
Review.belongsTo(User, { foreignKey: 'userId' });
Review.belongsTo(Service, { foreignKey: 'serviceId' });
Review.belongsTo(Job, { foreignKey: 'jobId' });
Job.hasOne(Review,{foreignKey:'jobId'});
Job.belongsTo(Service, { foreignKey: 'serviceId' });
Job.belongsTo(User, { as: 'customer', foreignKey: 'customerId' });
Job.belongsTo(User, { as: 'performer', foreignKey: 'performerId' });
User.hasMany(Service, {foreignKey: 'userId'});
User.hasMany(Job, {foreignKey: 'customerId'});
User.hasMany(Job,{foreignKey:'performerId'});
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
    Calendar,
};