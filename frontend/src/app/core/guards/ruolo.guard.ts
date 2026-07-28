import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";
import { AuthService } from "../services/auth.service";
import { RuoloUtente } from "../models/ruolo-utente";

// va usato dopo authGuard; il ruolo richiesto si legge da "data" della rotta
export const ruoloGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const ruoloRichiesto = route.data["ruoloRichiesto"] as RuoloUtente;

  if (authService.utenteCorrente()?.ruolo === ruoloRichiesto) {
    return true;
  }

  return router.parseUrl("/");
};
