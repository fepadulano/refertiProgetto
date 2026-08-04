import { Client } from "pg";
import { randomUUID } from "crypto";

// Stesse credenziali del database usate dal backend (vedi backend/.env).
const CONNESSIONE_DB = {
  host: "localhost",
  user: "postgres",
  password: "postgres",
  database: "nome_db_medico",
};

export const ADMIN_EMAIL = "admin.playwright@test.it";
export const ADMIN_PASSWORD = "PasswordAdmin123!";

// Hash bcrypt precalcolato di ADMIN_PASSWORD (saltRounds 10, stesso
// algoritmo di BcryptPasswordHasher). Evitiamo di installare bcrypt anche
// nel frontend solo per questo unico inserimento.
const HASH_PASSWORD_ADMIN =
  "$2b$10$mdq7.EPv1LYNUYQClpAnQu16K1CS3GP6CVTDLOx8LOPHRcCoKgkvS";

// Non esiste (giustamente) un endpoint pubblico per creare il primo admin:
// lo seminiamo direttamente nel database, una volta sola prima di tutti i
// test, con le stesse credenziali fisse ad ogni esecuzione (idempotente:
// se esiste già, non lo tocca).
export default async function globalSetup(): Promise<void> {
  const client = new Client(CONNESSIONE_DB);
  await client.connect();

  try {
    const esistente = await client.query("SELECT id FROM utenti WHERE email = $1", [
      ADMIN_EMAIL,
    ]);

    if (esistente.rowCount === 0) {
      await client.query(
        `INSERT INTO utenti (id, nome, cognome, email, "passwordHash", ruolo, attivo, "createdAt")
         VALUES ($1, 'Admin', 'Playwright', $2, $3, 'ADMIN', true, now())`,
        [randomUUID(), ADMIN_EMAIL, HASH_PASSWORD_ADMIN],
      );
    }
  } finally {
    await client.end();
  }
}
