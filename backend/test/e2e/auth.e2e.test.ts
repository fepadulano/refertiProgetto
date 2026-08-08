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

  it("effettua il login con credenziali corrette e restituisce un token e un refresh token", async () => {
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
      .send({ email, password, captchaToken: "test-captcha-token" });

    expect(risposta.status).toBe(200);
    expect(typeof risposta.body.token).toBe("string");
    expect(typeof risposta.body.refreshToken).toBe("string");
  });

  it("rifiuta il login senza il token captcha", async () => {
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

    expect(risposta.status).toBe(400);
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
      .send({ email, password: "PasswordSbagliata1!", captchaToken: "test-captcha-token" });

    expect(risposta.status).toBe(401);
  });

  it("con un refresh token valido ottiene un nuovo access token, utilizzabile su una rotta protetta", async () => {
    const email = emailCasuale("paziente");
    await request(app).post("/api/auth/registrazione-paziente").send({
      nome: "Mario",
      cognome: "Rossi",
      email,
      password,
      codiceFiscale: codiceFiscaleCasuale(),
      dataNascita: "1990-05-15",
    });
    const login = await request(app)
      .post("/api/auth/login")
      .send({ email, password, captchaToken: "test-captcha-token" });

    const refresh = await request(app)
      .post("/api/auth/refresh")
      .send({ refreshToken: login.body.refreshToken });

    expect(refresh.status).toBe(200);
    expect(typeof refresh.body.token).toBe("string");

    const storico = await request(app)
      .get("/api/pazienti/me/referti")
      .set("Authorization", `Bearer ${refresh.body.token}`);

    expect(storico.status).toBe(200);
  });

  it("rifiuta un refresh token non valido", async () => {
    const risposta = await request(app)
      .post("/api/auth/refresh")
      .send({ refreshToken: "questo-non-e-un-jwt-valido" });

    expect(risposta.status).toBe(401);
  });

  it("rifiuta il refresh senza il campo refreshToken (validazione zod)", async () => {
    const risposta = await request(app).post("/api/auth/refresh").send({});

    expect(risposta.status).toBe(400);
  });
});
