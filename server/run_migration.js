const sequelize = require('./config/db');

async function migrate() {
  await sequelize.getQueryInterface().addColumn('Chatrooms', 'lastActivityAt', {
    type: require('sequelize').DataTypes.DATE,
    allowNull: false,
    defaultValue: new Date(),
  });

  console.log('✅ Migration complete!');
}

migrate().catch(console.error);
