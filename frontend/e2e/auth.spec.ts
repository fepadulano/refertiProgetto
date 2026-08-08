import { test, expect } from "@playwright/test";
import {
  emailCasuale,
  codiceFiscaleCasuale,
  login,
  loginConRefresh,
  impostaSessione,
  stubCaptcha,
  registraPaziente,
} from "./helpers";

test("un paziente si registra tramite il form reale", async ({ page }) => {
  const email = emailCasuale("paziente");

  await page.goto("/registrazione");
  await page.locator("#nome").fill("Mario");
  await page.locator("#cognome").fill("Rossi");
  await page.locator("#email").fill(email);
  await page.locator("#password").fill("PasswordSicura123!");
  await page.locator("#codiceFiscale").fill(codiceFiscaleCasuale());
  await page.locator("#dataNascita").fill("1990-05-15");
  await page.getByRole("button", { name: "Registrati" }).click();

  await expect(page.getByText("Registrazione completata!")).toBeVisible();
  await expect(page).toHaveURL(/\/login$/, { timeout: 5000 });
});

test("login con credenziali corrette porta alla home", async ({ page, context }) => {
  const { email } = await registraPaziente(page.request, {
    nome: "Paolo",
    cognome: "Bianchi",
    password: "PasswordSicura123!",
  });
  await stubCaptcha(context, true);

  await page.goto("/login");
  await page.locator("#email").fill(email);
  await page.locator("#password").fill("PasswordSicura123!");
  await page.getByRole("button", { name: "Accedi" }).click();

  await expect(page).toHaveURL("/");
  await expect(page.getByRole("heading", { name: "Bentornato." })).toBeVisible();
});

test("il login blocca l'invio se il captcha non è stato completato", async ({ page, context }) => {
  const { email } = await registraPaziente(page.request, {
    nome: "Sara",
    cognome: "Gialli",
    password: "PasswordSicura123!",
  });
  await stubCaptcha(context, false);

  await page.goto("/login");
  await page.locator("#email").fill(email);
  await page.locator("#password").fill("PasswordSicura123!");
  await page.getByRole("button", { name: "Accedi" }).click();

  await expect(
    page.getByText("Completa la verifica captcha prima di continuare."),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/login$/);
});

test("senza login, una pagina protetta reindirizza a /login", async ({ page }) => {
  await page.goto("/storico");
  await expect(page).toHaveURL(/\/login$/);
});

test("con una sessione valida, la home mostra i dati dell'utente", async ({ page }) => {
  const { email } = await registraPaziente(page.request, {
    nome: "Luca",
    cognome: "Verdi",
    password: "PasswordSicura123!",
  });
  const token = await login(page.request, email, "PasswordSicura123!");
  await impostaSessione(page.context(), token);

  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Bentornato." })).toBeVisible();
  await expect(page.getByText("PAZIENTE")).toBeVisible();
});

test("con un access token scaduto ma un refresh token valido, la sessione si rinnova da sola", async ({
  page,
}) => {
  const { email } = await registraPaziente(page.request, {
    nome: "Giulia",
    cognome: "Ferrari",
    password: "PasswordSicura123!",
  });
  const { token, refreshToken } = await loginConRefresh(page.request, email, "PasswordSicura123!");

  // stessa forma di un JWT vero (così AuthService lo decodifica comunque
  // per popolare l'utente), ma con la firma manomessa: il backend lo
  // rifiuterà con 401 alla prima richiesta protetta, esattamente come un
  // token scaduto
  const tokenManomesso = token.slice(0, -5) + "XXXXX";
  await impostaSessione(page.context(), tokenManomesso, refreshToken);

  await page.goto("/storico");

  // se il refresh silenzioso funziona, la pagina protetta si carica comunque,
  // senza rimbalzare l'utente al login
  await expect(page).toHaveURL(/\/storico$/);
  await expect(page.getByText("Nessun referto trovato.")).toBeVisible();
});

test("un paziente non può aprire la pagina di caricamento referti, riservata al medico", async ({
  page,
}) => {
  const { email } = await registraPaziente(page.request, {
    nome: "Anna",
    cognome: "Neri",
    password: "PasswordSicura123!",
  });
  const token = await login(page.request, email, "PasswordSicura123!");
  await impostaSessione(page.context(), token);

  await page.goto("/carica-referto");

  await expect(page).toHaveURL("/");
});
