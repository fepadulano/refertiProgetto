// Configurazione per sequelize-cli: legge le stesse variabili d'ambiente
// già usate dal resto del backend (vedi .env / src/frameworks/config/env.ts),
// invece di duplicare le credenziali in un file a parte.
require("dotenv").config();

const comune = {
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  host: process.env.DB_HOST,
  dialect: "postgres",
};

module.exports = {
  development: comune,
  test: comune,
  production: comune,
};
