import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";
import { AuthService } from "../services/auth.service";

// va usato dopo authGuard, su tutte le rotte protette tranne /cambia-password
// stessa: un account con una password provvisoria (RF2, RF9) non può usare
// il sistema finché non la sostituisce con una scelta da lui (Sezione 4.1.10)
export const passwordGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.utenteCorrente()?.deveCambiarePassword) {
    return router.parseUrl("/cambia-password");
  }

  return true;
};
