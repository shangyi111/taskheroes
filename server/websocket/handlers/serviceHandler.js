const { emitToUser } = require('../socketService');

function sendServiceCreated(service) {
  emitToUser(service.userId, 'service_created', service);
}

function sendServiceUpdated(service) {
  emitToUser(service.userId, 'service_updated', service);
}

function sendServiceDeleted(serviceId, userId) {
  emitToUser(userId, 'service_deleted', { serviceId });
}

module.exports = {
  sendServiceCreated,
  sendServiceUpdated,
  sendServiceDeleted,
};
