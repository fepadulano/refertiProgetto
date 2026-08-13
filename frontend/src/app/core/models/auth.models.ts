import { RuoloUtente } from "./ruolo-utente";

// Corpo della richiesta POST /api/auth/login
export interface LoginRequest {
  email: string;
  password: string;
  captchaToken: string;
}

// Corpo della risposta di POST /api/auth/login (200 OK)
export interface LoginResponse {
  messaggio: string;
  token: string;
  refreshToken: string;
}

// Corpo della risposta di POST /api/auth/refresh (200 OK)
export interface RefreshResponse {
  token: string;
}

// Corpo della richiesta POST /api/auth/cambia-password
export interface CambiaPasswordRequest {
  passwordAttuale: string;
  nuovaPassword: string;
}

// Corpo della risposta di POST /api/auth/cambia-password (200 OK)
export interface CambiaPasswordResponse {
  messaggio: string;
  token: string;
}

// Le informazioni contenute nel payload del token JWT
// (vedi backend/src/frameworks/security/JwtTokenManager.ts)
export interface UtenteAutenticato {
  id: string;
  ruolo: RuoloUtente;
  deveCambiarePassword: boolean;
}

// Forma standard con cui il backend risponde in caso di errore
// (vedi backend/src/adapters/controllers/gestisciErroreHttp.ts)
export interface ErroreApi {
  errore: string;
}
