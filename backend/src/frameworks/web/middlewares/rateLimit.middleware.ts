import rateLimit from "express-rate-limit";

// limite per IP sul login, prima ancora che la richiesta arrivi al caso d'uso
export const limitatoreLogin = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    errore: "Troppi tentativi di login da questo indirizzo IP. Riprova più tardi.",
  },
});
