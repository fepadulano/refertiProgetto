import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";
import { AuthService } from "../services/auth.service";

// Impedisce di raggiungere una pagina protetta se nessun utente ha
// effettuato il login: in quel caso reindirizza alla pagina di login.
export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.utenteCorrente()) {
    return true;
  }

  return router.parseUrl("/login");
};
