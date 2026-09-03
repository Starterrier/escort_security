import { Injectable, signal } from '@angular/core';

export interface Aviso {
  id: number;
  tipo: 'exito' | 'error' | 'info';
  texto: string;
}

/**
 * Avisos flotantes del panel administrativo.
 */
@Injectable({ providedIn: 'root' })
export class AvisosService {
  private siguienteId = 1;
  private readonly _avisos = signal<Aviso[]>([]);

  readonly avisos = this._avisos.asReadonly();

  exito(texto: string): void {
    this.mostrar('exito', texto);
  }

  error(texto: string): void {
    this.mostrar('error', texto, 6000);
  }

  info(texto: string): void {
    this.mostrar('info', texto);
  }

  cerrar(id: number): void {
    this._avisos.update((lista) => lista.filter((a) => a.id !== id));
  }

  private mostrar(tipo: Aviso['tipo'], texto: string, duracion = 4000): void {
    const id = this.siguienteId++;

    this._avisos.update((lista) => [...lista, { id, tipo, texto }]);

    setTimeout(() => this.cerrar(id), duracion);
  }
}
