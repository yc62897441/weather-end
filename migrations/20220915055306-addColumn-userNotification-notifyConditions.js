'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.addColumn('UserNotifications', 'temperature', {
      type: Sequelize.INTEGER
    })
    await queryInterface.addColumn('UserNotifications', 'apparentTemperature', {
      type: Sequelize.INTEGER
    })
    await queryInterface.addColumn('UserNotifications', 'rainrate', {
      type: Sequelize.INTEGER
    })
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.removeColumn('UserNotifications', 'temperature')
    await queryInterface.removeColumn('UserNotifications', 'apparentTemperature')
    await queryInterface.removeColumn('UserNotifications', 'rainrate')
  }
};
