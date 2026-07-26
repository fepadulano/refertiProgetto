import { Sequelize } from "sequelize";
import { UtenteModel } from "../database/models/UtenteModel";
import { PazienteModel } from "../database/models/PazienteModel";
import { MedicoModel } from "../database/models/MedicoModel";
import { env } from "../config/env";

// Creiamo la connessione (usando Postgres invece di SQLite per via dei requisiti medici)
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

    // Lo schema del database non viene più sincronizzato automaticamente
    // (sync({alter:true})): è gestito da migrazioni versionate
    // (src/frameworks/database/migrations/), eseguite a parte con
    // "npx sequelize-cli db:migrate" prima di avviare l'app o i test.

    await rendiAuditLogImmutabile();
    console.log("🔒 Vincolo di sola-scrittura su audit_logs applicato.");
  } catch (error) {
    console.error("❌ Impossibile connettersi al database:", error);
  }
}

// RNF3 (tracciabilità e non-ripudio): audit_logs deve essere append-only,
// e nessun attore (nemmeno un amministratore di database) deve poter
// modificare o cancellare un log già scritto. Un vincolo lato applicazione
// non basta, perché chi ha accesso diretto al database lo aggirerebbe
// con una query SQL: serve un trigger nel database stesso, che blocca
// UPDATE e DELETE indipendentemente da chi si è connesso.
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
