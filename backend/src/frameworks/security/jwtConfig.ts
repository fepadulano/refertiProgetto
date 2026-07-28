import { env } from "../config/env";

// condivisa da chi firma (JwtTokenManager) e chi verifica (auth.middleware) i token
export const JWT_SECRET = env.jwt.secret;

export const JWT_EXPIRES_IN = env.jwt.scadenza;
