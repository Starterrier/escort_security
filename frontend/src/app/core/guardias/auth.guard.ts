import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../servicios/auth.service';

/** Exige sesion activa para entrar al panel. */
export const authGuard: CanActivateFn = (_ruta, estado) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.autenticado()) {
    return true;
  }

  return router.createUrlTree(['/admin/entrar'], {
    queryParams: { regresar: estado.url },
  });
};

/** Exige perfil de administrador (gestion de usuarios). */
export const adminGuard: CanActivateFn = (ruta, estado) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const permitido = authGuard(ruta, estado);

  if (permitido !== true) {
    return permitido;
  }

  return auth.esAdmin() ? true : router.createUrlTree(['/admin']);
};

/** Impide volver al login cuando ya hay sesion. */
export const invitadoGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.autenticado() ? router.createUrlTree(['/admin']) : true;
};
