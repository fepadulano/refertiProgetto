import request from "supertest";
import { Response } from "superagent";
import { Express } from "express";
import * as fs from "fs";
import {
  avviaAppPerTest,
  chiudiConnessioniDiTest,
  creaAdminDiTest,
  emailCasuale,
  codiceFiscaleCasuale,
} from "./helpers";

const pdfFinto = Buffer.from("%PDF-1.4 contenuto finto per i test");

// Il download restituisce un PDF (binario), non JSON/testo: superagent non lo
// bufferizza automaticamente, quindi serve un parser esplicito per poterne
// confrontare i byte con quelli originali caricati.
function parserBinario(res: Response, callback: (err: Error | null, body: Buffer) => void): void {
  res.setEncoding("binary");
  let dati = "";
  res.on("data", (chunk: string) => {
    dati += chunk;
  });
  res.on("end", () => callback(null, Buffer.from(dati, "binary")));
}

describe("E2E - /api/referti", () => {
  let app: Express;
  let tokenMedico: string;
  let tokenAltroMedico: string;
  let pazienteId: string;

  beforeAll(async () => {
    app = await avviaAppPerTest();

    const admin = await creaAdminDiTest("PasswordAdmin123!");
    const loginAdmin = await request(app)
      .post("/api/auth/login")
      .send({ email: admin.email, password: "PasswordAdmin123!" });
    const tokenAdmin = loginAdmin.body.token;

    // Il medico che caricherà i referti
    const emailMedico = emailCasuale("medico");
    const passwordMedico = "PasswordMedico123!";
    await request(app)
      .post("/api/admin/crea-medico")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({
        nome: "Anna",
        cognome: "Neri",
        email: emailMedico,
        password: passwordMedico,
        specializzazione: "Radiologia",
        numeroMatricola: `MAT${Date.now()}`,
      });
    const loginMedico = await request(app)
      .post("/api/auth/login")
      .send({ email: emailMedico, password: passwordMedico });
    tokenMedico = loginMedico.body.token;

    // Un secondo medico, usato per verificare che NON possa scaricare
    // un referto caricato dal primo
    const emailAltroMedico = emailCasuale("medico");
    const passwordAltroMedico = "PasswordMedico123!";
    await request(app)
      .post("/api/admin/crea-medico")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({
        nome: "Marco",
        cognome: "Blu",
        email: emailAltroMedico,
        password: passwordAltroMedico,
        specializzazione: "Cardiologia",
        numeroMatricola: `MAT${Date.now() + 1}`,
      });
    const loginAltroMedico = await request(app)
      .post("/api/auth/login")
      .send({ email: emailAltroMedico, password: passwordAltroMedico });
    tokenAltroMedico = loginAltroMedico.body.token;

    // Il paziente a cui verranno associati i referti
    const codiceFiscale = codiceFiscaleCasuale();
    await request(app).post("/api/auth/registrazione-paziente").send({
      nome: "Paolo",
      cognome: "Bianchi",
      email: emailCasuale("paziente"),
      password: "PasswordPaziente123!",
      codiceFiscale,
      dataNascita: "1985-03-20",
    });

    // Il medico cerca il paziente per Codice Fiscale (RF3) per ottenere
    // il pazienteId da usare nell'upload — lo stesso flusso reale.
    const ricerca = await request(app)
      .get("/api/pazienti")
      .query({ codiceFiscale })
      .set("Authorization", `Bearer ${tokenMedico}`);
    pazienteId = ricerca.body.pazienteId;
  });

  afterAll(async () => {
    await chiudiConnessioniDiTest();
  });

  it("un medico carica un referto in PDF", async () => {
    const risposta = await request(app)
      .post("/api/referti")
      .set("Authorization", `Bearer ${tokenMedico}`)
      .field("pazienteId", pazienteId)
      .field("categoria", "Radiologia")
      .field("dataEsame", "2026-01-10")
      .attach("file", pdfFinto, {
        filename: "referto.pdf",
        contentType: "application/pdf",
      });

    expect(risposta.status).toBe(201);
    expect(risposta.body.referto.id).toBeDefined();
  });

  it("rifiuta l'upload senza il file allegato", async () => {
    const risposta = await request(app)
      .post("/api/referti")
      .set("Authorization", `Bearer ${tokenMedico}`)
      .field("pazienteId", pazienteId)
      .field("categoria", "Radiologia");

    expect(risposta.status).toBe(400);
  });

  it("rifiuta l'upload se il file allegato non è un PDF", async () => {
    const risposta = await request(app)
      .post("/api/referti")
      .set("Authorization", `Bearer ${tokenMedico}`)
      .field("pazienteId", pazienteId)
      .field("categoria", "Radiologia")
      .attach("file", Buffer.from("solo testo"), {
        filename: "referto.txt",
        contentType: "text/plain",
      });

    expect(risposta.status).toBe(400);
  });

  it("rifiuta l'upload senza token di autenticazione", async () => {
    const risposta = await request(app)
      .post("/api/referti")
      .field("pazienteId", pazienteId)
      .field("categoria", "Radiologia")
      .field("dataEsame", "2026-01-10")
      .attach("file", pdfFinto, {
        filename: "referto.pdf",
        contentType: "application/pdf",
      });

    expect(risposta.status).toBe(401);
  });

  it("il medico che ha caricato il referto può scaricarlo", async () => {
    const upload = await request(app)
      .post("/api/referti")
      .set("Authorization", `Bearer ${tokenMedico}`)
      .field("pazienteId", pazienteId)
      .field("categoria", "Esami del sangue")
      .field("dataEsame", "2026-01-10")
      .attach("file", pdfFinto, {
        filename: "referto.pdf",
        contentType: "application/pdf",
      });

    const refertoId = upload.body.referto.id;

    const download = await request(app)
      .get(`/api/referti/${refertoId}/download`)
      .set("Authorization", `Bearer ${tokenMedico}`);

    expect(download.status).toBe(200);
  });

  it("il file salvato su disco è cifrato, e il download restituisce il PDF originale", async () => {
    const upload = await request(app)
      .post("/api/referti")
      .set("Authorization", `Bearer ${tokenMedico}`)
      .field("pazienteId", pazienteId)
      .field("categoria", "Ecografia")
      .field("dataEsame", "2026-01-10")
      .attach("file", pdfFinto, {
        filename: "referto.pdf",
        contentType: "application/pdf",
      });

    const { id: refertoId, percorsoFile } = upload.body.referto;

    // Sul disco non deve esserci un PDF in chiaro (l'intestazione "%PDF-" non
    // deve comparire): il contenuto è cifrato (AES-256-GCM).
    const contenutoSuDisco = fs.readFileSync(percorsoFile);
    expect(contenutoSuDisco.toString("latin1", 0, 5)).not.toBe("%PDF-");

    const download = await request(app)
      .get(`/api/referti/${refertoId}/download`)
      .set("Authorization", `Bearer ${tokenMedico}`)
      .buffer()
      .parse(parserBinario);

    expect(download.status).toBe(200);
    expect((download.body as Buffer).equals(pdfFinto)).toBe(true);
  });

  it("un medico diverso da chi ha caricato il referto non può scaricarlo", async () => {
    const upload = await request(app)
      .post("/api/referti")
      .set("Authorization", `Bearer ${tokenMedico}`)
      .field("pazienteId", pazienteId)
      .field("categoria", "Risonanza")
      .field("dataEsame", "2026-01-10")
      .attach("file", pdfFinto, {
        filename: "referto.pdf",
        contentType: "application/pdf",
      });

    const refertoId = upload.body.referto.id;

    const download = await request(app)
      .get(`/api/referti/${refertoId}/download`)
      .set("Authorization", `Bearer ${tokenAltroMedico}`);

    expect(download.status).toBe(403);
  });
});
