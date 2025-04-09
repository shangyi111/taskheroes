const { emitToUser } = require('../socketService');

function sendProviderCreated(provider) {
  emitToUser(provider.userId, 'provider_created', provider);
}

function sendProviderUpdated(provider) {
  emitToUser(provider.userId, 'provider_updated', provider);
}

function sendProviderDeleted(providerId, userId) {
  emitToUser(userId, 'provider_deleted', { providerId });
}

module.exports = {
  sendProviderCreated,
  sendProviderUpdated,
  sendProviderDeleted,
};
