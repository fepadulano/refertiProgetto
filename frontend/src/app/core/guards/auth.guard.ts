import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";
import { AuthService } from "../services/auth.service";

// blocca l'accesso a pagine protette se nessuno ha fatto login
export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.utenteCorrente()) {
    return true;
  }

  return router.parseUrl("/login");
};
