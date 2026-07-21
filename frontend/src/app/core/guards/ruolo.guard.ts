import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";
import { AuthService } from "../services/auth.service";
import { RuoloUtente } from "../models/ruolo-utente";

// Impedisce di raggiungere una pagina riservata a un ruolo diverso dal
// proprio (es. un Paziente che prova ad aprire /carica-referto): in quel
// caso riporta alla home invece di far vedere una pagina che tanto
// fallirebbe al primo tentativo di chiamata al backend.
// Va usato DOPO authGuard, che garantisce che l'utente sia già loggato.
// Il ruolo richiesto si legge da "data" della rotta, es:
//   { path: "storico", canActivate: [ruoloGuard], data: { ruoloRichiesto: RuoloUtente.PAZIENTE } }
export const ruoloGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const ruoloRichiesto = route.data["ruoloRichiesto"] as RuoloUtente;

  if (authService.utenteCorrente()?.ruolo === ruoloRichiesto) {
    return true;
  }

  return router.parseUrl("/");
};
