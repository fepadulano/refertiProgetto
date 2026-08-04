import { test, expect } from "@playwright/test";
import { ADMIN_EMAIL, ADMIN_PASSWORD } from "./global-setup";
import { login, creaMedico, impostaSessione } from "./helpers";

// Non contiamo su un numero esatto di pagine (il database può già avere
// medici da esecuzioni precedenti): creiamo 6 medici nuovi, così siamo
// certi che esistano almeno 2 pagine (5 per pagina), a prescindere da cosa
// c'era già. Il totale esatto lo leggiamo dalla pagina stessa.
test("il paginator naviga avanti e indietro tra le pagine dei medici", async ({ page }) => {
  const tokenAdmin = await login(page.request, ADMIN_EMAIL, ADMIN_PASSWORD);
  for (let i = 0; i < 6; i++) {
    await creaMedico(page.request, tokenAdmin, {
      nome: "Medico",
      cognome: `Test${i}`,
      password: "PasswordMedico123!",
    });
  }

  await impostaSessione(page.context(), tokenAdmin);
  await page.goto("/gestione-medici");

  const precedente = page.getByRole("button", { name: "Precedente" });
  const successiva = page.getByRole("button", { name: "Successiva" });
  const indicatorePagina = page.getByText(/Pagina \d+ di \d+/);

  const testoIniziale = await indicatorePagina.textContent();
  const totale = testoIniziale?.match(/di (\d+)/)?.[1];

  await expect(indicatorePagina).toHaveText(`Pagina 1 di ${totale}`);
  await expect(precedente).toBeDisabled();
  await expect(successiva).toBeEnabled();

  await successiva.click();
  await expect(indicatorePagina).toHaveText(`Pagina 2 di ${totale}`);
  await expect(precedente).toBeEnabled();

  await precedente.click();
  await expect(indicatorePagina).toHaveText(`Pagina 1 di ${totale}`);
  await expect(precedente).toBeDisabled();
});
