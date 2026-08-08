import { test, expect } from "@playwright/test";
import * as path from "path";
import { ADMIN_EMAIL, ADMIN_PASSWORD } from "./global-setup";
import { login, creaMedico, registraPaziente, impostaSessione } from "./helpers";

const FILE_PDF = path.join(__dirname, "fixtures", "referto-test.pdf");

// Il test più importante della suite: un medico carica un referto per un
// paziente, e in un'altra scheda (un'altra sessione, come nella realtà) il
// paziente lo vede arrivare in tempo reale via WebSocket, senza ricaricare
// la pagina, e riesce a scaricarlo. Prova l'intera catena vera — cosa che
// i vecchi test Angular (con i servizi finti) non potevano mai dimostrare.
test("un medico carica un referto e il paziente lo vede arrivare in tempo reale", async ({
  browser,
  request,
}) => {
  // due pagine Angular avviate da zero più diverse chiamate di setup:
  // più lento dei test isolati, gli servono più dei 30s di default
  test.setTimeout(60_000);

  const tokenAdmin = await login(request, ADMIN_EMAIL, ADMIN_PASSWORD);
  const medico = await creaMedico(request, tokenAdmin, {
    nome: "Anna",
    cognome: "Neri",
    password: "PasswordMedico123!",
  });
  const paziente = await registraPaziente(request, {
    nome: "Mario",
    cognome: "Rossi",
    password: "PasswordSicura123!",
  });

  const tokenMedico = await login(request, medico.email, "PasswordMedico123!");
  const tokenPaziente = await login(request, paziente.email, "PasswordSicura123!");

  const contestoMedico = await browser.newContext();
  const contestoPaziente = await browser.newContext();
  await impostaSessione(contestoMedico, tokenMedico);
  await impostaSessione(contestoPaziente, tokenPaziente);

  const pageMedico = await contestoMedico.newPage();
  const pagePaziente = await contestoPaziente.newPage();

  // il paziente apre lo storico PRIMA dell'upload: deve avere la
  // connessione WebSocket già attiva per ricevere la notifica. La
  // richiesta di handshake parte prestissimo durante il boot di Angular,
  // quindi ci mettiamo in ascolto PRIMA di navigare, non dopo.
  const handshakeSocket = pagePaziente.waitForResponse((risposta) =>
    risposta.url().includes("/socket.io/"),
  );
  await pagePaziente.goto("/storico");
  await handshakeSocket;
  await expect(pagePaziente.getByText("Nessun referto trovato.")).toBeVisible();

  // il medico cerca il paziente e carica il referto
  await pageMedico.goto("/carica-referto");
  await pageMedico.getByPlaceholder("Codice fiscale (16 caratteri)").fill(paziente.codiceFiscale);
  await expect(pageMedico.getByText("Paziente trovato")).toBeVisible();

  await pageMedico.locator("#categoria").selectOption("Risonanza");
  await pageMedico.locator("#dataEsame").fill("2026-01-15");
  await pageMedico.locator("#file").setInputFiles(FILE_PDF);
  await pageMedico.getByRole("button", { name: "Carica referto" }).click();

  await expect(pageMedico.getByText("Referto caricato con successo.")).toBeVisible();

  // il paziente riceve la notifica in tempo reale, senza ricaricare
  await expect(pagePaziente.getByText(/Nuovo referto disponibile/)).toBeVisible({
    timeout: 10_000,
  });
  await expect(pagePaziente.getByRole("cell", { name: "Risonanza" })).toBeVisible();

  // e riesce a scaricare il PDF appena arrivato
  const downloadPromise = pagePaziente.waitForEvent("download");
  await pagePaziente.getByRole("button", { name: "Scarica PDF" }).click();
  const download = await downloadPromise;

  expect(download.suggestedFilename()).toMatch(/^referto-.*\.pdf$/);
});
