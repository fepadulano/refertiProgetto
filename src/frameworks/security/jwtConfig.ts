import { env } from "../config/env";

// Costante unica, condivisa da chi firma (JwtTokenManager) e chi verifica
// (auth.middleware) i token, per evitare che finiscano fuori sincrono.
// Il valore vero e proprio arriva da .env (vedi frameworks/config/env.ts).
export const JWT_SECRET = env.jwt.secret;

// Il token scadrà dopo 2 ore di inattività, costringendo a un nuovo login (buona pratica nei sistemi medici)
export const JWT_EXPIRES_IN = env.jwt.scadenza;
