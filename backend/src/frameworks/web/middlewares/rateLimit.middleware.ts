import rateLimit from "express-rate-limit";

// limite per IP su login e refresh, prima ancora che la richiesta arrivi al caso d'uso
export const limitatoreAuth = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    errore: "Troppi tentativi da questo indirizzo IP. Riprova più tardi.",
  },
});
