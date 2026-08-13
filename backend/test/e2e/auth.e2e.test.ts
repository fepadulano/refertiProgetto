import request from "supertest";
import { Express } from "express";
import * as jwt from "jsonwebtoken";
import {
  avviaAppPerTest,
  chiudiConnessioniDiTest,
  creaMedicoConTokenDiTest,
  creaPazienteDiTest,
} from "./helpers";

describe("E2E - /api/auth", () => {
  let app: Express;
  let tokenAdmin: string;

  beforeAll(async () => {
    app = await avviaAppPerTest();
    const medico = await creaMedicoConTokenDiTest(app);
    tokenAdmin = medico.tokenAdmin;
  });

  afterAll(async () => {
    await chiudiConnessioniDiTest();
  });

  it("effettua il login con credenziali corrette e restituisce un token e un refresh token", async () => {
    const paziente = await creaPazienteDiTest(app, tokenAdmin);

    const risposta = await request(app)
      .post("/api/auth/login")
      .send({
        email: paziente.email,
        password: paziente.password,
        captchaToken: "test-captcha-token",
      });

    expect(risposta.status).toBe(200);
    expect(typeof risposta.body.token).toBe("string");
    expect(typeof risposta.body.refreshToken).toBe("string");
  });

  it("rifiuta il login senza il token captcha", async () => {
    const paziente = await creaPazienteDiTest(app, tokenAdmin);

    const risposta = await request(app)
      .post("/api/auth/login")
      .send({ email: paziente.email, password: paziente.password });

    expect(risposta.status).toBe(400);
  });

  it("rifiuta il login con la password sbagliata", async () => {
    const paziente = await creaPazienteDiTest(app, tokenAdmin);

    const risposta = await request(app)
      .post("/api/auth/login")
      .send({
        email: paziente.email,
        password: "PasswordSbagliata1!",
        captchaToken: "test-captcha-token",
      });

    expect(risposta.status).toBe(401);
  });

  it("con un refresh token valido ottiene un nuovo access token, utilizzabile su una rotta protetta", async () => {
    const paziente = await creaPazienteDiTest(app, tokenAdmin);
    const login = await request(app)
      .post("/api/auth/login")
      .send({
        email: paziente.email,
        password: paziente.password,
        captchaToken: "test-captcha-token",
      });

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

  it("un account appena creato ha deveCambiarePassword=true nel token", async () => {
    const paziente = await creaPazienteDiTest(app, tokenAdmin);
    const login = await request(app)
      .post("/api/auth/login")
      .send({
        email: paziente.email,
        password: paziente.password,
        captchaToken: "test-captcha-token",
      });

    const payload = jwt.decode(login.body.token) as { deveCambiarePassword: boolean };
    expect(payload.deveCambiarePassword).toBe(true);
  });

  it("cambia la password e restituisce un token con deveCambiarePassword=false", async () => {
    const paziente = await creaPazienteDiTest(app, tokenAdmin);
    const login = await request(app)
      .post("/api/auth/login")
      .send({
        email: paziente.email,
        password: paziente.password,
        captchaToken: "test-captcha-token",
      });

    const cambio = await request(app)
      .post("/api/auth/cambia-password")
      .set("Authorization", `Bearer ${login.body.token}`)
      .send({
        passwordAttuale: paziente.password,
        nuovaPassword: "PasswordNuovaScelta1!",
      });

    expect(cambio.status).toBe(200);
    const payload = jwt.decode(cambio.body.token) as { deveCambiarePassword: boolean };
    expect(payload.deveCambiarePassword).toBe(false);

    // la vecchia password non funziona più, la nuova sì
    const loginVecchia = await request(app)
      .post("/api/auth/login")
      .send({
        email: paziente.email,
        password: paziente.password,
        captchaToken: "test-captcha-token",
      });
    expect(loginVecchia.status).toBe(401);

    const loginNuova = await request(app)
      .post("/api/auth/login")
      .send({
        email: paziente.email,
        password: "PasswordNuovaScelta1!",
        captchaToken: "test-captcha-token",
      });
    expect(loginNuova.status).toBe(200);
  });

  it("rifiuta il cambio password se la password attuale è sbagliata", async () => {
    const paziente = await creaPazienteDiTest(app, tokenAdmin);
    const login = await request(app)
      .post("/api/auth/login")
      .send({
        email: paziente.email,
        password: paziente.password,
        captchaToken: "test-captcha-token",
      });

    const cambio = await request(app)
      .post("/api/auth/cambia-password")
      .set("Authorization", `Bearer ${login.body.token}`)
      .send({
        passwordAttuale: "PasswordSbagliata1!",
        nuovaPassword: "PasswordNuovaScelta1!",
      });

    expect(cambio.status).toBe(400);
  });

  it("rifiuta il cambio password senza autenticazione", async () => {
    const risposta = await request(app)
      .post("/api/auth/cambia-password")
      .send({
        passwordAttuale: "qualsiasi",
        nuovaPassword: "PasswordNuovaScelta1!",
      });

    expect(risposta.status).toBe(401);
  });
});
