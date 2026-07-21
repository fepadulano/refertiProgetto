import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

// Se il backend risponde 401 (token mancante, scaduto o manomesso) su una
// qualsiasi richiesta protetta, la sessione locale non è più valida: puliamo
// il token e riportiamo l'utente al login, invece di lasciarlo bloccato
// sulla pagina con un errore generico che non spiega cosa fare.
// Il login stesso può rispondere 401 per credenziali sbagliate: quel caso va
// escluso, altrimenti "svuoteremmo" un login che l'utente sta ancora provando.
export const erroreInterceptor: HttpInterceptorFn = (richiesta, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return next(richiesta).pipe(
    catchError((errore) => {
      const isLoginFallito = richiesta.url.includes('/auth/login');

      if (errore.status === 401 && !isLoginFallito) {
        authService.logout();
        router.navigateByUrl('/login');
      }

      return throwError(() => errore);
    }),
  );
};
