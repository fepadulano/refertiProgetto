import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

// su 401 pulisce la sessione e torna al login, tranne quando il 401
// arriva dal login stesso (credenziali sbagliate, non sessione scaduta)
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
