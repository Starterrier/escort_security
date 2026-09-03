import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { AuthService } from '../servicios/auth.service';

/**
 * Adjunta el token a las peticiones del panel y cierra la sesion ante un 401.
 */
export const authInterceptor: HttpInterceptorFn = (peticion, siguiente) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const token = auth.token();

  const conCredenciales =
    token && (peticion.url.includes('/admin/') || peticion.url.includes('/auth/'));

  const enviada = conCredenciales
    ? peticion.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : peticion;

  return siguiente(enviada).pipe(
    catchError((error: HttpErrorResponse) => {
      const esLogin = peticion.url.includes('/auth/login');

      if (error.status === 401 && !esLogin) {
        auth.limpiar();
        void router.navigate(['/admin/entrar'], {
          queryParams: { regresar: router.url },
        });
      }

      return throwError(() => error);
    }),
  );
};
