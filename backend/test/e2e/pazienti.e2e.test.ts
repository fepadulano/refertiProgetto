import request from "supertest";
import { Express } from "express";
import {
  avviaAppPerTest,
  chiudiConnessioniDiTest,
  creaMedicoConTokenDiTest,
  creaPazienteDiTest,
} from "./helpers";

const pdfFinto = Buffer.from("%PDF-1.4 contenuto finto per i test");

describe("E2E - /api/pazienti", () => {
  let app: Express;
  let tokenMedico: string;
  let tokenPaziente: string;
  let tokenAltroPaziente: string;
  let codiceFiscale: string;
  let pazienteId: string;

  beforeAll(async () => {
    app = await avviaAppPerTest();

    const medico = await creaMedicoConTokenDiTest(app);
    tokenMedico = medico.token;

    const paziente = await creaPazienteDiTest(app, medico.tokenAdmin, {
      nome: "Paolo",
      cognome: "Bianchi",
    });
    codiceFiscale = paziente.codiceFiscale;
    const loginPaziente = await request(app)
      .post("/api/auth/login")
      .send({
        email: paziente.email,
        password: paziente.password,
        captchaToken: "test-captcha-token",
      });
    tokenPaziente = loginPaziente.body.token;

    const ricerca = await request(app)
      .get("/api/pazienti")
      .query({ codiceFiscale })
      .set("Authorization", `Bearer ${tokenMedico}`);
    pazienteId = ricerca.body.pazienteId;

    // Un secondo paziente, per verificare che non veda lo storico altrui
    const altroPaziente = await creaPazienteDiTest(app, medico.tokenAdmin, {
      nome: "Sara",
      cognome: "Gialli",
    });
    const loginAltroPaziente = await request(app)
      .post("/api/auth/login")
      .send({
        email: altroPaziente.email,
        password: altroPaziente.password,
        captchaToken: "test-captcha-token",
      });
    tokenAltroPaziente = loginAltroPaziente.body.token;

    // Due referti associati al primo paziente, di categorie diverse
    await request(app)
      .post("/api/referti")
      .set("Authorization", `Bearer ${tokenMedico}`)
      .field("pazienteId", pazienteId)
      .field("categoria", "Radiologia")
      .field("dataEsame", "2026-01-10")
      .attach("file", pdfFinto, {
        filename: "a.pdf",
        contentType: "application/pdf",
      });
    await request(app)
      .post("/api/referti")
      .set("Authorization", `Bearer ${tokenMedico}`)
      .field("pazienteId", pazienteId)
      .field("categoria", "Esami del sangue")
      .field("dataEsame", "2026-01-11")
      .attach("file", pdfFinto, {
        filename: "b.pdf",
        contentType: "application/pdf",
      });
  });

  afterAll(async () => {
    await chiudiConnessioniDiTest();
  });

  it("un medico trova un paziente per codice fiscale (RF3)", async () => {
    const risposta = await request(app)
      .get("/api/pazienti")
      .query({ codiceFiscale })
      .set("Authorization", `Bearer ${tokenMedico}`);

    expect(risposta.status).toBe(200);
    expect(risposta.body.nome).toBe("Paolo");
  });

  it("rifiuta la ricerca senza il parametro codiceFiscale (validazione zod)", async () => {
    const risposta = await request(app)
      .get("/api/pazienti")
      .set("Authorization", `Bearer ${tokenMedico}`);

    expect(risposta.status).toBe(400);
  });

  it("rifiuta la ricerca se chi la fa non è un medico", async () => {
    const risposta = await request(app)
      .get("/api/pazienti")
      .query({ codiceFiscale })
      .set("Authorization", `Bearer ${tokenPaziente}`);

    expect(risposta.status).toBe(403);
  });

  it("il paziente vede il proprio storico referti, dal più recente (RF5)", async () => {
    const risposta = await request(app)
      .get(`/api/pazienti/${pazienteId}/referti`)
      .set("Authorization", `Bearer ${tokenPaziente}`);

    expect(risposta.status).toBe(200);
    // "Esami del sangue" è stato caricato per secondo: deve comparire per primo
    expect(risposta.body.referti[0].categoria).toBe("Esami del sangue");
    expect(risposta.body.referti[1].categoria).toBe("Radiologia");
  });

  it("filtra lo storico per categoria (RF7)", async () => {
    const risposta = await request(app)
      .get(`/api/pazienti/${pazienteId}/referti`)
      .query({ categoria: "Radiologia" })
      .set("Authorization", `Bearer ${tokenPaziente}`);

    expect(risposta.status).toBe(200);
    expect(
      risposta.body.referti.every(
        (r: { categoria: string }) => r.categoria === "Radiologia",
      ),
    ).toBe(true);
  });

  it("un paziente non può vedere lo storico di un altro paziente", async () => {
    const risposta = await request(app)
      .get(`/api/pazienti/${pazienteId}/referti`)
      .set("Authorization", `Bearer ${tokenAltroPaziente}`);

    expect(risposta.status).toBe(403);
  });
});
