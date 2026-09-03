import { HttpErrorResponse } from '@angular/common/http';

/** Cuerpo de error que devuelve la API PHP. */
interface CuerpoError {
  ok?: false;
  mensaje?: string;
  errores?: Record<string, string>;
}

/**
 * Traduce un HttpErrorResponse al mensaje que se muestra al usuario.
 */
export function mensajeDeError(error: unknown): string {
  if (!(error instanceof HttpErrorResponse)) {
    return 'Ocurrio un error inesperado.';
  }

  if (error.status === 0) {
    return 'No se pudo conectar con el servidor. Revise su conexion e intentelo de nuevo.';
  }

  const cuerpo = error.error as CuerpoError | string | null;

  if (cuerpo && typeof cuerpo === 'object' && cuerpo.mensaje) {
    return cuerpo.mensaje;
  }

  switch (error.status) {
    case 401:
      return 'Su sesion expiro. Vuelva a iniciar sesion.';
    case 403:
      return 'No tiene permisos para realizar esta accion.';
    case 404:
      return 'No encontramos el recurso solicitado.';
    case 429:
      return 'Demasiadas peticiones. Espere un momento e intentelo de nuevo.';
    default:
      return 'Ocurrio un error en el servidor. Intentelo de nuevo en unos minutos.';
  }
}

/**
 * Errores por campo que devuelve la validacion (HTTP 422).
 */
export function erroresDeCampo(error: unknown): Record<string, string> {
  if (!(error instanceof HttpErrorResponse)) {
    return {};
  }

  const cuerpo = error.error as CuerpoError | null;

  return cuerpo && typeof cuerpo === 'object' ? (cuerpo.errores ?? {}) : {};
}
