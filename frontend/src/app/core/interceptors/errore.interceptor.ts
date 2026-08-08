import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

// Su 401 proviamo prima a rinnovare la sessione col refresh token (senza
// far ripetere login/captcha all'utente) e a ripetere la richiesta
// originale. Solo se anche il refresh fallisce puliamo la sessione e
// torniamo al login. Le rotte di login/refresh sono escluse: un 401 lì
// significa credenziali/refresh token sbagliati, non sessione scaduta.
export const erroreInterceptor: HttpInterceptorFn = (richiesta, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const isRottaAuth =
    richiesta.url.includes('/auth/login') || richiesta.url.includes('/auth/refresh');

  return next(richiesta).pipe(
    catchError((errore) => {
      if (errore.status !== 401 || isRottaAuth) {
        return throwError(() => errore);
      }

      if (!authService.getRefreshToken()) {
        authService.logout();
        router.navigateByUrl('/login');
        return throwError(() => errore);
      }

      return authService.refreshToken().pipe(
        switchMap(() => {
          const richiestaConNuovoToken = richiesta.clone({
            setHeaders: { Authorization: `Bearer ${authService.getToken()}` },
          });
          return next(richiestaConNuovoToken);
        }),
        catchError((erroreRefresh) => {
          authService.logout();
          router.navigateByUrl('/login');
          return throwError(() => erroreRefresh);
        }),
      );
    }),
  );
};
