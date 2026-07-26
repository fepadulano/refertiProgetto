import request from "supertest";
import { Express } from "express";
import {
  avviaAppPerTest,
  chiudiConnessioniDiTest,
  creaAdminDiTest,
  emailCasuale,
  codiceFiscaleCasuale,
} from "./helpers";

describe("E2E - /api/admin", () => {
  let app: Express;
  let tokenAdmin: string;
  let tokenPaziente: string;

  const passwordAdmin = "PasswordAdmin123!";
  const passwordPaziente = "PasswordPaziente123!";

  beforeAll(async () => {
    app = await avviaAppPerTest();

    const admin = await creaAdminDiTest(passwordAdmin);
    const loginAdmin = await request(app)
      .post("/api/auth/login")
      .send({ email: admin.email, password: passwordAdmin, captchaToken: "test-captcha-token" });
    tokenAdmin = loginAdmin.body.token;

    const emailPaziente = emailCasuale("paziente");
    await request(app).post("/api/auth/registrazione-paziente").send({
      nome: "Paolo",
      cognome: "Bianchi",
      email: emailPaziente,
      password: passwordPaziente,
      codiceFiscale: codiceFiscaleCasuale(),
      dataNascita: "1980-01-01",
    });
    const loginPaziente = await request(app)
      .post("/api/auth/login")
      .send({ email: emailPaziente, password: passwordPaziente, captchaToken: "test-captcha-token" });
    tokenPaziente = loginPaziente.body.token;
  });

  afterAll(async () => {
    await chiudiConnessioniDiTest();
  });

  it("un admin autenticato può creare un account medico", async () => {
    const risposta = await request(app)
      .post("/api/admin/crea-medico")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({
        nome: "Anna",
        cognome: "Neri",
        email: emailCasuale("medico"),
        password: "PasswordMedico123!",
        specializzazione: "Cardiologia",
        numeroMatricola: `MAT${Date.now()}`,
      });

    expect(risposta.status).toBe(201);
    expect(risposta.body.medicoId).toBeDefined();
  });

  it("rifiuta la creazione di un medico senza token (401, middleware JWT)", async () => {
    const risposta = await request(app).post("/api/admin/crea-medico").send({
      nome: "Anna",
      cognome: "Neri",
      email: emailCasuale("medico"),
      password: "PasswordMedico123!",
      specializzazione: "Cardiologia",
      numeroMatricola: `MAT${Date.now()}`,
    });

    expect(risposta.status).toBe(401);
  });

  it("rifiuta la creazione di un medico se chi chiama non è un admin (403)", async () => {
    const risposta = await request(app)
      .post("/api/admin/crea-medico")
      .set("Authorization", `Bearer ${tokenPaziente}`)
      .send({
        nome: "Anna",
        cognome: "Neri",
        email: emailCasuale("medico"),
        password: "PasswordMedico123!",
        specializzazione: "Cardiologia",
        numeroMatricola: `MAT${Date.now()}`,
      });

    expect(risposta.status).toBe(403);
  });

  it("un admin può disabilitare un medico, che non riesce più a fare login", async () => {
    const emailMedico = emailCasuale("medico");
    const passwordMedico = "PasswordMedico123!";

    const creazione = await request(app)
      .post("/api/admin/crea-medico")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({
        nome: "Luca",
        cognome: "Verdi",
        email: emailMedico,
        password: passwordMedico,
        specializzazione: "Radiologia",
        numeroMatricola: `MAT${Date.now()}`,
      });

    const medicoUtenteId = creazione.body.medicoId;

    const primoLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: emailMedico, password: passwordMedico, captchaToken: "test-captcha-token" });
    expect(primoLogin.status).toBe(200);

    const disabilitazione = await request(app)
      .post(`/api/admin/medici/${medicoUtenteId}/disabilita`)
      .set("Authorization", `Bearer ${tokenAdmin}`);
    expect(disabilitazione.status).toBe(200);

    const secondoLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: emailMedico, password: passwordMedico, captchaToken: "test-captcha-token" });
    expect(secondoLogin.status).toBe(401);
    expect(secondoLogin.body.errore).toMatch(/disabilitat/i);
  });
});
