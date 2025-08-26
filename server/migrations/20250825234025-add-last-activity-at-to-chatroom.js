module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Chatrooms', 'lastActivityAt', {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Chatrooms', 'lastActivityAt');
  },
};
