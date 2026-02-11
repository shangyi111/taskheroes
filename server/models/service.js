const { DataTypes } = require('sequelize');
const User = require('./user');
const sequelize = require('../config/db');
const cloudinary = require('cloudinary').v2;

const Service = sequelize.define('Service', {
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User, 
      key: 'id', 
    }, 
  },
  businessName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  businessAddress: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  phoneNumber: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  profilePicture: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: null,
  },
  portfolio: {
    type: DataTypes.JSONB, // Stores an array of URLs: ["url1", "url2", "url3"]
    allowNull: true,
    defaultValue: []
  },
  category: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  hourlyRate:{
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  customSections: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {
      general: { content: '', isPublic: true },
      faq: { content: '', isPublic: true },     // Includes "What to expect"
      payment: { content: '', isPublic: false }, // Private by default
      links: [],      // Array of { platform: string, url: string, isPublic: boolean }
      additional: []  // Escape hatch for everything else
    }
  },
  availabilityWindowDays: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 90,
  },
},{
  hooks: {
    // 1. Fires on Service.create()
    afterCreate: async (service) => {
      await confirmServiceImages(service);
    },
    // 2. Fires on Service.update() (if individualHooks: true is used)
    afterUpdate: async (service) => {
      await confirmServiceImages(service);
    }
  }
});

// Helper function to keep it DRY (Don't Repeat Yourself)
async function confirmServiceImages(service) {
  console.log('--- Processing Cloudinary Tags ---');
  
  // Use get({plain: true}) to avoid Sequelize metadata issues
  const data = service.get({ plain: true });
  const ids = [];

  if (data.profilePicture?.public_id) ids.push(data.profilePicture.public_id);
  if (Array.isArray(data.portfolio)) {
    data.portfolio.forEach(img => {
      if (img.public_id) ids.push(img.public_id);
    });
  }

  if (ids.length > 0) {
    try {
      // Switch the tags
      await cloudinary.uploader.add_tag('confirmed', ids);
      await cloudinary.uploader.remove_tag('temp_upload', ids);
      console.log(`Confirmed IDs: ${ids.join(', ')}`);
    } catch (err) {
      console.error('Cloudinary Tag Update Error:', err);
    }
  }
}
  
module.exports = Service;