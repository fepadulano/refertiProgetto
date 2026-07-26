"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("pazienti", {
      id: { type: Sequelize.UUID, primaryKey: true },
      utenteId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "utenti", key: "id" },
      },
      codiceFiscale: { type: Sequelize.STRING, allowNull: false, unique: true },
      dataNascita: { type: Sequelize.DATEONLY, allowNull: false },
      createdAt: { type: Sequelize.DATE, allowNull: false },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("pazienti");
  },
};
