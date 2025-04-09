const User = require('./user');
const Provider = require('./provider');
const Service = require('./service');
const RatingReview = require('./ratingReview');

// Define associations
Provider.belongsTo(User, { foreignKey: 'userId' });
Provider.hasMany(Service, { foreignKey: 'providerId' });
Provider.hasMany(RatingReview, { foreignKey: 'providerId' });
Service.belongsTo(Provider, { foreignKey: 'providerId' });
RatingReview.belongsTo(Provider, { foreignKey: 'providerId' });
RatingReview.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(RatingReview, {foreignKey: 'userId'});
User.hasMany(Provider, {foreignKey: 'userId'});

module.exports = {
    User,
    Provider,
    Service,
    RatingReview,
};