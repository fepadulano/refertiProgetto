"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("audit_logs", {
      id: { type: Sequelize.UUID, primaryKey: true },
      utenteId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "utenti", key: "id" },
      },
      tipoAzione: { type: Sequelize.STRING, allowNull: false },
      ipAddress: { type: Sequelize.STRING, allowNull: false },
      refertoId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: "referti", key: "id" },
      },
      timestamp: { type: Sequelize.DATE, allowNull: false },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("audit_logs");
  },
};
