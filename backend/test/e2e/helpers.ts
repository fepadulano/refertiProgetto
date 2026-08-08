import { app } from "../../src/frameworks/web/app";
import {
  database,
  inizializzaDatabase,
} from "../../src/frameworks/database/database";
import { UtenteModel } from "../../src/frameworks/database/models/UtenteModel";
import { BcryptPasswordHasher } from "../../src/frameworks/security/BcryptPasswordHasher";
import { CryptoGeneratoreUuid } from "../../src/frameworks/utils/CryptoGeneratoreUuid";
import { RuoloUtente } from "../../src/entities/Utente";

// I test e2e girano sopra il database Postgres vero (lo stesso configurato
// in .env): qui prepariamo la connessione una volta sola per file di test.
let giaInizializzato = false;

export async function avviaAppPerTest() {
  if (!giaInizializzato) {
    await inizializzaDatabase();
    giaInizializzato = true;
  }
  return app;
}

export async function chiudiConnessioniDiTest(): Promise<void> {
  await database.close();
}

// Genera valori unici ad ogni esecuzione, così i test si possono rilanciare
// più volte senza scontrarsi con vincoli di unicità (email, codice fiscale)
// lasciati dalla corsa precedente.
export function emailCasuale(prefisso: string): string {
  return `${prefisso}.${Date.now()}.${Math.floor(Math.random() * 100000)}@test.it`;
}

export function codiceFiscaleCasuale(): string {
  const cifre = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  return `CF${cifre}`.slice(0, 16).padEnd(16, "0");
}

const passwordHasher = new BcryptPasswordHasher();
const uuidGenerator = new CryptoGeneratoreUuid();

// Non esiste (giustamente) un endpoint pubblico per creare il primo admin:
// nella realtà quell'account viene seminato manualmente. Nei test facciamo
// lo stesso, scrivendo direttamente nel database.
export async function creaAdminDiTest(
  password: string,
): Promise<{ id: string; email: string }> {
  const email = emailCasuale("admin");
  const id = uuidGenerator.genera();

  await UtenteModel.create({
    id,
    nome: "Admin",
    cognome: "DiTest",
    email,
    passwordHash: await passwordHasher.hash(password),
    ruolo: RuoloUtente.ADMIN,
    attivo: true,
  });

  return { id, email };
}
