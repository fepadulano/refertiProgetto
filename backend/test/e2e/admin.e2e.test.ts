import request from "supertest";
import { Express } from "express";
import {
  avviaAppPerTest,
  chiudiConnessioniDiTest,
  creaAdminDiTest,
  creaPazienteDiTest,
  emailCasuale,
  codiceFiscaleCasuale,
} from "./helpers";

describe("E2E - /api/admin", () => {
  let app: Express;
  let tokenAdmin: string;
  let tokenPaziente: string;

  const passwordAdmin = "PasswordAdmin123!";

  beforeAll(async () => {
    app = await avviaAppPerTest();

    const admin = await creaAdminDiTest(passwordAdmin);
    const loginAdmin = await request(app)
      .post("/api/auth/login")
      .send({ email: admin.email, password: passwordAdmin, captchaToken: "test-captcha-token" });
    tokenAdmin = loginAdmin.body.token;

    // Serve solo un token di un ruolo diverso da Admin, per il test 403
    const paziente = await creaPazienteDiTest(app, tokenAdmin);
    const loginPaziente = await request(app)
      .post("/api/auth/login")
      .send({
        email: paziente.email,
        password: paziente.password,
        captchaToken: "test-captcha-token",
      });
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

  it("un admin crea l'account di un nuovo paziente (RF9)", async () => {
    const risposta = await request(app)
      .post("/api/admin/crea-paziente")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({
        nome: "Luca",
        cognome: "Verdi",
        email: emailCasuale("paziente"),
        password: "PasswordPaziente123!",
        codiceFiscale: codiceFiscaleCasuale(),
        dataNascita: "1990-05-15",
      });

    expect(risposta.status).toBe(201);
    expect(risposta.body.pazienteId).toBeDefined();
  });

  it("rifiuta la creazione di un paziente se chi la fa non è un admin", async () => {
    const risposta = await request(app)
      .post("/api/admin/crea-paziente")
      .set("Authorization", `Bearer ${tokenPaziente}`)
      .send({
        nome: "Luca",
        cognome: "Verdi",
        email: emailCasuale("paziente"),
        password: "PasswordPaziente123!",
        codiceFiscale: codiceFiscaleCasuale(),
        dataNascita: "1990-05-15",
      });

    expect(risposta.status).toBe(403);
  });

  it("rifiuta la creazione di un paziente con un'email già usata", async () => {
    const email = emailCasuale("paziente");
    const dati = {
      nome: "Luca",
      cognome: "Verdi",
      email,
      password: "PasswordPaziente123!",
      codiceFiscale: codiceFiscaleCasuale(),
      dataNascita: "1990-05-15",
    };

    await request(app)
      .post("/api/admin/crea-paziente")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send(dati);

    const seconda = await request(app)
      .post("/api/admin/crea-paziente")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({ ...dati, codiceFiscale: codiceFiscaleCasuale() });

    expect(seconda.status).toBe(400);
    expect(seconda.body.errore).toMatch(/email/i);
  });

  it("rifiuta la creazione di un paziente con un'email malformata (validazione zod)", async () => {
    const risposta = await request(app)
      .post("/api/admin/crea-paziente")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({
        nome: "Luca",
        cognome: "Verdi",
        email: "non-e-una-email",
        password: "PasswordPaziente123!",
        codiceFiscale: codiceFiscaleCasuale(),
        dataNascita: "1990-05-15",
      });

    expect(risposta.status).toBe(400);
  });
});
