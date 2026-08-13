import request from "supertest";
import { Express } from "express";
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

// Crea un Admin e un Medico tramite l'API (come nella realtà), e restituisce
// entrambi i token già pronti all'uso: l'Admin serve a chi deve registrare un
// paziente (RF9), il Medico a chi deve cercarlo o caricargli un referto.
export async function creaMedicoConTokenDiTest(
  app: Express,
): Promise<{ tokenAdmin: string; token: string; email: string }> {
  const passwordAdmin = "PasswordAdminDiTest123!";
  const admin = await creaAdminDiTest(passwordAdmin);
  const loginAdmin = await request(app)
    .post("/api/auth/login")
    .send({
      email: admin.email,
      password: passwordAdmin,
      captchaToken: "test-captcha-token",
    });
  const tokenAdmin = loginAdmin.body.token;

  const emailMedico = emailCasuale("medico");
  const passwordMedico = "PasswordMedicoDiTest123!";
  await request(app)
    .post("/api/admin/crea-medico")
    .set("Authorization", `Bearer ${tokenAdmin}`)
    .send({
      nome: "Medico",
      cognome: "DiTest",
      email: emailMedico,
      password: passwordMedico,
      specializzazione: "Medicina Generale",
      numeroMatricola: `MAT${Date.now()}${Math.floor(Math.random() * 1000)}`,
    });

  const loginMedico = await request(app)
    .post("/api/auth/login")
    .send({
      email: emailMedico,
      password: passwordMedico,
      captchaToken: "test-captcha-token",
    });

  return { tokenAdmin, token: loginMedico.body.token, email: emailMedico };
}

// RF9: crea l'account Paziente passando dall'Admin (segreteria/accettazione,
// non più autoregistrazione), con valori di default sovrascrivibili per i
// test che devono controllare un campo preciso.
export async function creaPazienteDiTest(
  app: Express,
  tokenAdmin: string,
  overrides: Partial<{
    nome: string;
    cognome: string;
    email: string;
    password: string;
    codiceFiscale: string;
    dataNascita: string;
  }> = {},
): Promise<{ email: string; password: string; codiceFiscale: string }> {
  const email = overrides.email ?? emailCasuale("paziente");
  const password = overrides.password ?? "PasswordSicura123!";
  const codiceFiscale = overrides.codiceFiscale ?? codiceFiscaleCasuale();

  await request(app)
    .post("/api/admin/crea-paziente")
    .set("Authorization", `Bearer ${tokenAdmin}`)
    .send({
      nome: overrides.nome ?? "Mario",
      cognome: overrides.cognome ?? "Rossi",
      email,
      password,
      codiceFiscale,
      dataNascita: overrides.dataNascita ?? "1990-05-15",
    });

  return { email, password, codiceFiscale };
}
