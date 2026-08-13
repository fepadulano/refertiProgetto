import { test, expect } from "@playwright/test";
import { ADMIN_EMAIL, ADMIN_PASSWORD } from "./global-setup";
import {
  emailCasuale,
  codiceFiscaleCasuale,
  login,
  loginConRefresh,
  impostaSessione,
  stubCaptcha,
  registraPaziente,
  registraPazienteConPasswordProvvisoria,
} from "./helpers";

test.describe("Autenticazione", () => {
  // L'admin seminato in global-setup, condiviso da tutti i test di questo
  // file: serve solo come "chi crea l'account paziente" (RF9), non è quello
  // che i singoli test vogliono verificare. Fare un solo login, invece che
  // in ogni test, evita anche di far scattare il rate limiter del login
  // (Sezione 4.1.5) a furia di ripetere lo stesso login.
  let tokenAdmin: string;

  test.beforeAll(async ({ request }) => {
    tokenAdmin = await login(request, ADMIN_EMAIL, ADMIN_PASSWORD);
  });

  test("un admin registra un nuovo paziente tramite il form reale", async ({ page }) => {
    await impostaSessione(page.context(), tokenAdmin);

    const email = emailCasuale("paziente");

    await page.goto("/registra-paziente");
    await page.locator("#nome").fill("Mario");
    await page.locator("#cognome").fill("Rossi");
    await page.locator("#email").fill(email);
    await page.locator("#password").fill("PasswordSicura123!");
    await page.locator("#codiceFiscale").fill(codiceFiscaleCasuale());
    await page.locator("#dataNascita").fill("1990-05-15");
    await page.getByRole("button", { name: "Registra paziente" }).click();

    await expect(
      page.getByText("Account Paziente creato con successo."),
    ).toBeVisible();
  });

  test("login con credenziali corrette porta alla home", async ({ page, context }) => {
    const { email } = await registraPaziente(page.request, tokenAdmin, {
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
    const { email } = await registraPaziente(page.request, tokenAdmin, {
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
    const { email } = await registraPaziente(page.request, tokenAdmin, {
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
    const { email } = await registraPaziente(page.request, tokenAdmin, {
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
    const { email } = await registraPaziente(page.request, tokenAdmin, {
      nome: "Anna",
      cognome: "Neri",
      password: "PasswordSicura123!",
    });
    const token = await login(page.request, email, "PasswordSicura123!");
    await impostaSessione(page.context(), token);

    await page.goto("/carica-referto");

    await expect(page).toHaveURL("/");
  });

  test("un account appena creato deve cambiare la password provvisoria prima di usare il sistema", async ({
    page,
  }) => {
    const { email } = await registraPazienteConPasswordProvvisoria(
      page.request,
      tokenAdmin,
      { nome: "Marco", cognome: "Ferri", password: "PasswordProvvisoria1!" },
    );
    const token = await login(page.request, email, "PasswordProvvisoria1!");
    await impostaSessione(page.context(), token);

    // qualunque pagina protetta prova ad aprire, la guardia lo reindirizza qui
    await page.goto("/storico");
    await expect(page).toHaveURL(/\/cambia-password$/);

    await page.locator("#passwordAttuale").fill("PasswordProvvisoria1!");
    await page.locator("#nuovaPassword").fill("PasswordDefinitiva1!");
    await page.locator("#confermaPassword").fill("PasswordDefinitiva1!");
    await page.getByRole("button", { name: "Salva nuova password" }).click();

    // completato il cambio, l'app porta alla home (non conserva la pagina di destinazione originale)
    await expect(page).toHaveURL("/");
    await expect(
      page.getByText("Password aggiornata con successo."),
    ).toBeVisible();

    // navigazione interna alla SPA (non un reload di pagina): un vero
    // reload rifarebbe scattare l'addInitScript di impostaSessione,
    // riscrivendo in localStorage il vecchio token con la password
    // provvisoria e falsando il test
    await page.getByRole("link", { name: "I miei referti", exact: true }).click();
    await expect(page).toHaveURL(/\/storico$/);
  });
});
