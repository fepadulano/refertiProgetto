"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("referti", {
      id: { type: Sequelize.UUID, primaryKey: true },
      medicoId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "medici", key: "id" },
      },
      pazienteId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "pazienti", key: "id" },
      },
      percorsoFile: { type: Sequelize.STRING, allowNull: false },
      categoria: { type: Sequelize.STRING, allowNull: false },
      dataEsame: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      dataCaricamento: { type: Sequelize.DATE, allowNull: false },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("referti");
  },
};
