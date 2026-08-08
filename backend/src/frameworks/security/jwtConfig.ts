import { env } from "../config/env";

// condivisa da chi firma (JwtTokenManager) e chi verifica (auth.middleware) i token
export const JWT_SECRET = env.jwt.secret;

export const JWT_EXPIRES_IN = env.jwt.scadenza;

// secret diversa da quella dell'access token: se JWT_SECRET trapelasse, il
// refresh token (che vive molto più a lungo) resterebbe comunque al sicuro
export const JWT_REFRESH_SECRET = env.jwt.refreshSecret;

export const JWT_REFRESH_EXPIRES_IN = env.jwt.refreshScadenza;
