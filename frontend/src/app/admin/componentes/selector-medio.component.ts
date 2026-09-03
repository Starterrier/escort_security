import { ChangeDetectionStrategy, Component, effect, inject, input, model, signal } from '@angular/core';

import { IconoComponent } from '../../compartido/componentes/icono.component';
import { Medio } from '../../core/modelos/api.modelos';
import { mensajeDeError } from '../../core/interceptores/errores';
import { ApiService } from '../../core/servicios/api.service';
import { AvisosService } from '../../core/servicios/avisos.service';

/**
 * Campo para elegir una imagen de la biblioteca o subir una nueva.
 *
 * Trabaja sobre el id del medio (`valor`) y expone la vista previa.
 */
@Component({
  selector: 'app-selector-medio',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconoComponent],
  templateUrl: './selector-medio.component.html',
  styleUrl: './selector-medio.component.scss',
})
export class SelectorMedioComponent {
  private readonly api = inject(ApiService);
  private readonly avisos = inject(AvisosService);

  /** Id del medio seleccionado (null si no hay). */
  readonly valor = model<number | null>(null);
  /** Medio ya guardado, para pintar la vista previa al abrir el formulario. */
  readonly medioInicial = input<Medio | null>(null);
  readonly etiqueta = input('Imagen');
  readonly ayuda = input('');

  protected readonly abierto = signal(false);
  protected readonly cargando = signal(false);
  protected readonly subiendo = signal(false);
  protected readonly biblioteca = signal<Medio[]>([]);
  protected readonly seleccionado = signal<Medio | null>(null);
  protected readonly busqueda = signal('');

  constructor() {
    // Cuando el formulario carga un registro existente, muestra su imagen.
    effect(() => {
      const inicial = this.medioInicial();

      if (inicial && inicial.id === this.valor()) {
        this.seleccionado.set(inicial);
      } else if (this.valor() === null) {
        this.seleccionado.set(null);
      }
    });
  }

  protected abrir(): void {
    this.abierto.set(true);
    this.cargarBiblioteca();
  }

  protected cerrar(): void {
    this.abierto.set(false);
  }

  protected buscar(evento: Event): void {
    this.busqueda.set((evento.target as HTMLInputElement).value);
    this.cargarBiblioteca();
  }

  protected elegir(medio: Medio): void {
    this.seleccionado.set(medio);
    this.valor.set(medio.id);
    this.cerrar();
  }

  protected quitar(): void {
    this.seleccionado.set(null);
    this.valor.set(null);
  }

  protected alSubir(evento: Event): void {
    const entrada = evento.target as HTMLInputElement;
    const archivo = entrada.files?.[0];

    if (!archivo) {
      return;
    }

    this.subiendo.set(true);

    this.api.subir<Medio>('/admin/media', archivo).subscribe({
      next: (medio) => {
        this.subiendo.set(false);
        entrada.value = '';
        this.biblioteca.update((lista) => [medio, ...lista]);
        this.elegir(medio);
        this.avisos.exito('Imagen subida.');
      },
      error: (error) => {
        this.subiendo.set(false);
        entrada.value = '';
        this.avisos.error(mensajeDeError(error));
      },
    });
  }

  private cargarBiblioteca(): void {
    this.cargando.set(true);

    this.api
      .getPaginado<Medio>('/admin/media', { por_pagina: 60, q: this.busqueda() })
      .subscribe({
        next: ({ datos }) => {
          this.biblioteca.set(datos);
          this.cargando.set(false);
        },
        error: (error) => {
          this.cargando.set(false);
          this.avisos.error(mensajeDeError(error));
        },
      });
  }
}
