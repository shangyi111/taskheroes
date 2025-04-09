const { Provider } = require('../models');
const {
  sendProviderUpdate,
  sendProviderCreated,
  sendProviderDeleted,
} = require('../websocket/handlers/providerHandler');

// Get all providers
exports.getAllProviders = async (req, res) => {
  try {
    console.log("inside get all providers");
    const providers = await Provider.findAll();
    res.json(providers);
  } catch (error) {
    console.log("error inside get all providers",error);
    res.status(500).json({ message: error.message });
  }
};

// Get a specific provider by ID
exports.getProviderById = async (req, res) => {
  try {
    const provider = await Provider.findByPk(req.params.id);
    if (provider) {
      res.json(provider);
    } else {
      res.status(404).json({ message: 'Provider not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a new provider
exports.createProvider = async (req, res) => {
  try {
    const newProvider = await Provider.create({ ...req.body, userId: req.user.id }); // Assuming req.user contains user info
    res.status(201).json(newProvider);
    sendProviderCreated(newProvider);
  } catch (error) {
    const message = error.errors[0].message;
    res.status(400).json({ message });
  }
};

exports.updateProvider = async (req, res) => {
  try {
    const providerId = req.params.id;
    const [updatedRowCount] = await Provider.update(req.body, {
      where: { id: providerId, userId: req.user.id }, // Ensure user owns the provider
      returning: true, // To get the updated record
    });

    if (updatedRowCount > 0) {
      const updatedProvider = await Provider.findByPk(providerId);
      res.status(200).json(updatedProvider);
      sendProviderUpdate(updatedProvider);
    } else {
      res.status(404).json({ message: 'Provider not found or unauthorized' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete a provider
exports.deleteProvider = async (req, res) => {
  try {
    const provider = await Provider.findByPk(req.params.id);
    if (!provider || provider.userId !== req.user.id) { // Ensure user owns the provider
      return res.status(404).json({ message: 'Provider not found or unauthorized' });
    }
    const deletedRows = await Provider.destroy({
      where: { id: req.params.id },
    });
    if (deletedRows > 0) {
      res.status(204).send();
      sendProviderDeleted(provider.id, provider.userId);
    } else {
      res.status(404).json({ message: 'Provider not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};