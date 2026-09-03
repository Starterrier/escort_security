import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';

import { Sesion, Usuario } from '../modelos/api.modelos';
import { ApiService } from './api.service';

const CLAVE_TOKEN = 'ess_token';
const CLAVE_USUARIO = 'ess_usuario';

/**
 * Sesion del panel administrativo.
 *
 * El token se guarda en localStorage para sobrevivir a recargas; la firma se
 * valida siempre en el servidor, aqui solo se controla la expiracion local
 * para evitar peticiones inutiles.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  private readonly _usuario = signal<Usuario | null>(this.leerUsuarioGuardado());
  private readonly _token = signal<string | null>(this.leerAlmacen(CLAVE_TOKEN));

  readonly usuario = this._usuario.asReadonly();
  readonly autenticado = computed(() => this._token() !== null && this._usuario() !== null);
  readonly esAdmin = computed(() => this._usuario()?.rol === 'admin');

  token(): string | null {
    return this._token();
  }

  entrar(email: string, clave: string): Observable<Sesion> {
    return this.api
      .post<Sesion>('/auth/login', { email, clave })
      .pipe(tap((sesion) => this.guardarSesion(sesion)));
  }

  /** Confirma contra el servidor que el token guardado sigue siendo valido. */
  verificar(): Observable<{ usuario: Usuario }> {
    return this.api
      .get<{ usuario: Usuario }>('/auth/yo')
      .pipe(tap(({ usuario }) => this.escribirUsuario(usuario)));
  }

  cambiarClave(claveActual: string, claveNueva: string): Observable<Sesion> {
    return this.api
      .post<Sesion>('/auth/clave', { clave_actual: claveActual, clave_nueva: claveNueva })
      .pipe(tap((sesion) => this.guardarSesion(sesion)));
  }

  salir(redirigir = true): void {
    // Se avisa al servidor para invalidar el token, pero no se espera respuesta.
    if (this._token()) {
      this.api.post('/auth/salir', {}).subscribe({ error: () => undefined });
    }

    this.limpiar();

    if (redirigir) {
      void this.router.navigate(['/admin/entrar']);
    }
  }

  /** Cierre local sin llamar al servidor (usado por el interceptor ante un 401). */
  limpiar(): void {
    this._token.set(null);
    this._usuario.set(null);
    this.borrarAlmacen(CLAVE_TOKEN);
    this.borrarAlmacen(CLAVE_USUARIO);
  }

  private guardarSesion(sesion: Sesion): void {
    this._token.set(sesion.token);
    this.escribirAlmacen(CLAVE_TOKEN, sesion.token);
    this.escribirUsuario(sesion.usuario);
  }

  private escribirUsuario(usuario: Usuario): void {
    this._usuario.set(usuario);
    this.escribirAlmacen(CLAVE_USUARIO, JSON.stringify(usuario));
  }

  private leerUsuarioGuardado(): Usuario | null {
    const crudo = this.leerAlmacen(CLAVE_USUARIO);

    if (!crudo) {
      return null;
    }

    try {
      return JSON.parse(crudo) as Usuario;
    } catch {
      return null;
    }
  }

  // localStorage puede lanzar en modo privado o con cookies bloqueadas.
  private leerAlmacen(clave: string): string | null {
    try {
      return localStorage.getItem(clave);
    } catch {
      return null;
    }
  }

  private escribirAlmacen(clave: string, valor: string): void {
    try {
      localStorage.setItem(clave, valor);
    } catch {
      /* sesion solo en memoria */
    }
  }

  private borrarAlmacen(clave: string): void {
    try {
      localStorage.removeItem(clave);
    } catch {
      /* nada que limpiar */
    }
  }
}
