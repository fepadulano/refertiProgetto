import request from "supertest";
import { Express } from "express";
import {
  avviaAppPerTest,
  chiudiConnessioniDiTest,
  emailCasuale,
  codiceFiscaleCasuale,
} from "./helpers";

describe("E2E - /api/auth", () => {
  let app: Express;

  beforeAll(async () => {
    app = await avviaAppPerTest();
  });

  afterAll(async () => {
    await chiudiConnessioniDiTest();
  });

  const password = "PasswordSicura123!";

  it("registra un nuovo paziente", async () => {
    const email = emailCasuale("paziente");

    const risposta = await request(app)
      .post("/api/auth/registrazione-paziente")
      .send({
        nome: "Mario",
        cognome: "Rossi",
        email,
        password,
        codiceFiscale: codiceFiscaleCasuale(),
        dataNascita: "1990-05-15",
      });

    expect(risposta.status).toBe(201);
    expect(risposta.body.utenteId).toBeDefined();
  });

  it("rifiuta una seconda registrazione con la stessa email", async () => {
    const email = emailCasuale("paziente");
    const datiRegistrazione = {
      nome: "Mario",
      cognome: "Rossi",
      email,
      password,
      codiceFiscale: codiceFiscaleCasuale(),
      dataNascita: "1990-05-15",
    };

    await request(app)
      .post("/api/auth/registrazione-paziente")
      .send(datiRegistrazione);

    const seconda = await request(app)
      .post("/api/auth/registrazione-paziente")
      .send({ ...datiRegistrazione, codiceFiscale: codiceFiscaleCasuale() });

    expect(seconda.status).toBe(400);
    expect(seconda.body.errore).toMatch(/email/i);
  });

  it("rifiuta la registrazione con un'email malformata (validazione zod)", async () => {
    const risposta = await request(app)
      .post("/api/auth/registrazione-paziente")
      .send({
        nome: "Mario",
        cognome: "Rossi",
        email: "non-e-una-email",
        password,
        codiceFiscale: codiceFiscaleCasuale(),
        dataNascita: "1990-05-15",
      });

    expect(risposta.status).toBe(400);
  });

  it("effettua il login con credenziali corrette e restituisce un token", async () => {
    const email = emailCasuale("paziente");
    await request(app).post("/api/auth/registrazione-paziente").send({
      nome: "Mario",
      cognome: "Rossi",
      email,
      password,
      codiceFiscale: codiceFiscaleCasuale(),
      dataNascita: "1990-05-15",
    });

    const risposta = await request(app)
      .post("/api/auth/login")
      .send({ email, password });

    expect(risposta.status).toBe(200);
    expect(typeof risposta.body.token).toBe("string");
  });

  it("rifiuta il login con la password sbagliata", async () => {
    const email = emailCasuale("paziente");
    await request(app).post("/api/auth/registrazione-paziente").send({
      nome: "Mario",
      cognome: "Rossi",
      email,
      password,
      codiceFiscale: codiceFiscaleCasuale(),
      dataNascita: "1990-05-15",
    });

    const risposta = await request(app)
      .post("/api/auth/login")
      .send({ email, password: "PasswordSbagliata1!" });

    expect(risposta.status).toBe(401);
  });

  it("blocca l'account dopo troppi tentativi falliti, anche con la password corretta", async () => {
    const email = emailCasuale("paziente");
    await request(app).post("/api/auth/registrazione-paziente").send({
      nome: "Mario",
      cognome: "Rossi",
      email,
      password,
      codiceFiscale: codiceFiscaleCasuale(),
      dataNascita: "1990-05-15",
    });

    // 5 tentativi falliti consecutivi: il 6°, anche con la password giusta,
    // deve essere rifiutato perché l'account risulta temporaneamente bloccato.
    for (let i = 0; i < 5; i++) {
      await request(app)
        .post("/api/auth/login")
        .send({ email, password: "PasswordSbagliata1!" });
    }

    const risposta = await request(app)
      .post("/api/auth/login")
      .send({ email, password });

    expect(risposta.status).toBe(401);
    expect(risposta.body.errore).toMatch(/troppi tentativi/i);
  });
});
