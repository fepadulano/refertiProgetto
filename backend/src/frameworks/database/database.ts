import { Sequelize } from "sequelize";
import { UtenteModel } from "../database/models/UtenteModel";
import { PazienteModel } from "../database/models/PazienteModel";
import { MedicoModel } from "../database/models/MedicoModel";
import { env } from "../config/env";

// Postgres invece di SQLite per via dei requisiti medici
export const database = new Sequelize(
  env.db.nome,
  env.db.utente,
  env.db.password,
  {
    host: env.db.host,
    dialect: "postgres",
    logging: false,
  },
);

export async function inizializzaDatabase() {
  try {
    await database.authenticate();
    console.log("📦 Connessione a PostgreSQL stabilita.");

    // schema gestito da migrazioni versionate ("npx sequelize-cli db:migrate"), non più da sync({alter:true})
    await rendiAuditLogImmutabile();
    console.log("🔒 Vincolo di sola-scrittura su audit_logs applicato.");
  } catch (error) {
    console.error("❌ Impossibile connettersi al database:", error);
  }
}

// RNF3: audit_logs deve essere append-only anche per chi ha accesso diretto
// al DB, quindi il vincolo va messo a livello di trigger, non di applicazione
async function rendiAuditLogImmutabile() {
  await database.query(`
    CREATE OR REPLACE FUNCTION blocca_modifica_audit_log()
    RETURNS TRIGGER AS $$
    BEGIN
      RAISE EXCEPTION 'audit_logs è di sola scrittura: UPDATE e DELETE non sono permessi.';
    END;
    $$ LANGUAGE plpgsql;
  `);

  await database.query(`
    DROP TRIGGER IF EXISTS audit_logs_immutabile ON audit_logs;
  `);

  await database.query(`
    CREATE TRIGGER audit_logs_immutabile
    BEFORE UPDATE OR DELETE ON audit_logs
    FOR EACH ROW EXECUTE FUNCTION blocca_modifica_audit_log();
  `);
}
