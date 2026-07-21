import rateLimit from "express-rate-limit";

// Limite di rete (per indirizzo IP), indipendente dall'account: protegge
// l'endpoint di login da tentativi massivi/distribuiti su tante email diverse,
// prima ancora che la richiesta arrivi al caso d'uso. Il blocco per singolo
// account (dopo troppi LOGIN_FALLITO) è gestito invece in LoginUseCase.
export const limitatoreLogin = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    errore: "Troppi tentativi di login da questo indirizzo IP. Riprova più tardi.",
  },
});
