import { APIRequestContext, BrowserContext } from "@playwright/test";

const API_URL = "http://localhost:3000/api";

// Genera valori unici ad ogni esecuzione, così i test si possono rilanciare
// più volte senza scontrarsi con vincoli di unicità (email, codice fiscale).
export function emailCasuale(prefisso: string): string {
  return `${prefisso}.${Date.now()}.${Math.floor(Math.random() * 100000)}@test.it`;
}

export function codiceFiscaleCasuale(): string {
  const cifre = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  return `CF${cifre}`.slice(0, 16).padEnd(16, "0");
}

// Le seguenti funzioni parlano direttamente con l'API (non passano dal
// browser): servono solo a preparare i dati per il test, non sono quello
// che il test vuole verificare. L'interazione vera avviene sempre via
// pagina, dentro gli spec.

export async function login(
  request: APIRequestContext,
  email: string,
  password: string,
): Promise<string> {
  const risposta = await request.post(`${API_URL}/auth/login`, {
    data: { email, password, captchaToken: "test-captcha-token" },
  });
  const corpo = await risposta.json();
  if (!risposta.ok()) {
    throw new Error(`Login fallito per ${email}: ${JSON.stringify(corpo)}`);
  }
  return corpo.token;
}

// Come login(), ma restituisce anche il refresh token — serve solo al test
// che verifica il rinnovo automatico della sessione (vedi auth.spec.ts).
export async function loginConRefresh(
  request: APIRequestContext,
  email: string,
  password: string,
): Promise<{ token: string; refreshToken: string }> {
  const risposta = await request.post(`${API_URL}/auth/login`, {
    data: { email, password, captchaToken: "test-captcha-token" },
  });
  const corpo = await risposta.json();
  if (!risposta.ok()) {
    throw new Error(`Login fallito per ${email}: ${JSON.stringify(corpo)}`);
  }
  return { token: corpo.token, refreshToken: corpo.refreshToken };
}

export async function creaMedico(
  request: APIRequestContext,
  tokenAdmin: string,
  dati: { nome: string; cognome: string; password: string },
): Promise<{ email: string }> {
  const email = emailCasuale("medico");
  const risposta = await request.post(`${API_URL}/admin/crea-medico`, {
    headers: { Authorization: `Bearer ${tokenAdmin}` },
    data: {
      nome: dati.nome,
      cognome: dati.cognome,
      email,
      password: dati.password,
      specializzazione: "Radiologia",
      numeroMatricola: `MAT${Date.now()}${Math.floor(Math.random() * 1000)}`,
    },
  });
  if (!risposta.ok()) {
    throw new Error(`Creazione medico fallita: ${JSON.stringify(await risposta.json())}`);
  }
  return { email };
}

// Il vero widget di Google è pensato per reagire all'automazione del
// browser (è un anti-bot, letteralmente il suo scopo): aspettarlo o
// risolverlo renderebbe i test lenti e imprevedibili. Simuliamo
// "grecaptcha" prima che Angular parta, così testiamo la vera logica di
// login.component.ts (chiama grecaptcha.render()/getResponse()) senza
// dipendere dalla rete di Google. risolto=false riproduce lo stato prima
// che l'utente clicchi la casella.
export async function stubCaptcha(context: BrowserContext, risolto: boolean): Promise<void> {
  // blocchiamo lo script vero di Google: altrimenti arriverebbe comunque da
  // internet e sovrascriverebbe il nostro finto grecaptcha una volta caricato
  await context.route("**/recaptcha/**", (route) => route.abort());

  await context.addInitScript((giaRisolto) => {
    (window as unknown as { grecaptcha: unknown }).grecaptcha = {
      render: () => 0,
      getResponse: () => (giaRisolto ? "token-captcha-finto" : ""),
      reset: () => {},
    };
  }, risolto);
}

// Mette un token JWT già pronto in localStorage prima che Angular parta,
// così AuthService lo trova subito e la pagina si apre già "loggata" —
// evita di dover rifare il form di login (con relativo captcha) in ogni
// test che ha solo bisogno di una sessione valida.
export async function impostaSessione(
  context: BrowserContext,
  token: string,
  refreshToken?: string,
): Promise<void> {
  await context.addInitScript(
    ({ token, refreshToken }) => {
      localStorage.setItem("referti_token", token);
      if (refreshToken) {
        localStorage.setItem("referti_refresh_token", refreshToken);
      }
    },
    { token, refreshToken },
  );
}

export async function registraPaziente(
  request: APIRequestContext,
  dati: { nome: string; cognome: string; password: string },
): Promise<{ email: string; codiceFiscale: string }> {
  const email = emailCasuale("paziente");
  const codiceFiscale = codiceFiscaleCasuale();
  const risposta = await request.post(`${API_URL}/auth/registrazione-paziente`, {
    data: {
      nome: dati.nome,
      cognome: dati.cognome,
      email,
      password: dati.password,
      codiceFiscale,
      dataNascita: "1990-05-15",
    },
  });
  if (!risposta.ok()) {
    throw new Error(`Registrazione paziente fallita: ${JSON.stringify(await risposta.json())}`);
  }
  return { email, codiceFiscale };
}
