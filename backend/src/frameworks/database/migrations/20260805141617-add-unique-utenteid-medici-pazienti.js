"use strict";

// Prima solo la foreign key impediva riferimenti a utenti inesistenti, ma
// nulla vietava a un utente di avere due profili medico/paziente: il
// vincolo "un utente ha al massimo un profilo" viveva solo nel codice
// applicativo, non nel database.
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.addConstraint("medici", {
      fields: ["utenteId"],
      type: "unique",
      name: "medici_utenteId_unique",
    });
    await queryInterface.addConstraint("pazienti", {
      fields: ["utenteId"],
      type: "unique",
      name: "pazienti_utenteId_unique",
    });
  },

  async down(queryInterface) {
    await queryInterface.removeConstraint("medici", "medici_utenteId_unique");
    await queryInterface.removeConstraint("pazienti", "pazienti_utenteId_unique");
  },
};
