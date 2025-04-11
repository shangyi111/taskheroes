const User = require('./user');
const Provider = require('./provider');
const Service = require('./service');
const RatingReview = require('./ratingReview');

// Define associations
Service.belongsTo(User, { foreignKey: 'userId' });
RatingReview.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(RatingReview, {foreignKey: 'userId'});
User.hasMany(Service, {foreignKey: 'userId'});

module.exports = {
    User,
    Provider,
    Service,
    RatingReview,
};