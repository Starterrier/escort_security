import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import { MetaPaginacion, RespuestaApi } from '../modelos/api.modelos';

export interface Paginado<T> {
  datos: T[];
  meta: MetaPaginacion;
}

/**
 * Cliente HTTP de la API PHP. Desenvuelve la respuesta `{ ok, datos }`
 * para que el resto de la aplicacion trabaje con el dato directamente.
 */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl.replace(/\/$/, '');

  get<T>(ruta: string, parametros?: Record<string, string | number | boolean>): Observable<T> {
    return this.http
      .get<RespuestaApi<T>>(this.url(ruta), { params: this.params(parametros) })
      .pipe(map((r) => r.datos));
  }

  /** Igual que `get` pero conservando la metainformacion de paginacion. */
  getPaginado<T>(
    ruta: string,
    parametros?: Record<string, string | number | boolean>,
  ): Observable<Paginado<T>> {
    return this.http
      .get<RespuestaApi<T[]>>(this.url(ruta), { params: this.params(parametros) })
      .pipe(
        map((r) => ({
          datos: r.datos,
          meta: r.meta ?? { total: r.datos.length, pagina: 1, por_pagina: r.datos.length, paginas: 1 },
        })),
      );
  }

  post<T>(ruta: string, cuerpo: unknown): Observable<T> {
    return this.http.post<RespuestaApi<T>>(this.url(ruta), cuerpo).pipe(map((r) => r.datos));
  }

  put<T>(ruta: string, cuerpo: unknown): Observable<T> {
    return this.http.put<RespuestaApi<T>>(this.url(ruta), cuerpo).pipe(map((r) => r.datos));
  }

  patch<T>(ruta: string, cuerpo: unknown): Observable<T> {
    return this.http.patch<RespuestaApi<T>>(this.url(ruta), cuerpo).pipe(map((r) => r.datos));
  }

  delete<T>(ruta: string, parametros?: Record<string, string | number | boolean>): Observable<T> {
    return this.http
      .delete<RespuestaApi<T>>(this.url(ruta), { params: this.params(parametros) })
      .pipe(map((r) => r.datos));
  }

  /** Subida multipart de un archivo a la biblioteca de medios. */
  subir<T>(ruta: string, archivo: File, alt = ''): Observable<T> {
    const formulario = new FormData();
    formulario.append('archivo', archivo);
    formulario.append('alt', alt);

    return this.http.post<RespuestaApi<T>>(this.url(ruta), formulario).pipe(map((r) => r.datos));
  }

  private url(ruta: string): string {
    return `${this.base}/${ruta.replace(/^\//, '')}`;
  }

  private params(parametros?: Record<string, string | number | boolean>): HttpParams {
    let params = new HttpParams();

    for (const [clave, valor] of Object.entries(parametros ?? {})) {
      if (valor !== '' && valor !== null && valor !== undefined) {
        params = params.set(clave, String(valor));
      }
    }

    return params;
  }
}
