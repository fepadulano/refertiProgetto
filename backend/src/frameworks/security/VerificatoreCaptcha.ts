import { env } from "../config/env";

const URL_VERIFICA = "https://www.google.com/recaptcha/api/siteverify";

// Chiede a Google se il token risolto dall'utente nel form di login e'
// valido. E' una verifica verso un servizio esterno (framework detail),
// per questo vive qui e non nel LoginUseCase, che resta puro.
export async function verificaCaptcha(token: string): Promise<boolean> {
  const risposta = await fetch(URL_VERIFICA, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      secret: env.recaptchaSecretKey,
      response: token,
    }),
  });

  const dati = (await risposta.json()) as { success: boolean };
  return dati.success === true;
}
