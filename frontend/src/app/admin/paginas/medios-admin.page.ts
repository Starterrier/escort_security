import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { IconoComponent } from '../../compartido/componentes/icono.component';
import { Medio, MetaPaginacion } from '../../core/modelos/api.modelos';
import { mensajeDeError } from '../../core/interceptores/errores';
import { ApiService } from '../../core/servicios/api.service';
import { AvisosService } from '../../core/servicios/avisos.service';

@Component({
  selector: 'app-medios-admin',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, DecimalPipe, IconoComponent],
  templateUrl: './medios-admin.page.html',
  styleUrl: './medios-admin.page.scss',
})
export class MediosAdminPage {
  private readonly api = inject(ApiService);
  private readonly avisos = inject(AvisosService);

  protected readonly medios = signal<Medio[]>([]);
  protected readonly meta = signal<MetaPaginacion | null>(null);
  protected readonly cargando = signal(true);
  protected readonly subiendo = signal(false);
  protected readonly busqueda = signal('');
  protected readonly pagina = signal(1);
  protected readonly detalle = signal<Medio | null>(null);
  protected readonly altEditado = signal('');
  protected readonly confirmando = signal<Medio | null>(null);

  /** [1, 2, 3...] para pintar la barra de paginacion. */
  protected readonly numerosPagina = computed(() =>
    Array.from({ length: this.meta()?.paginas ?? 0 }, (_, i) => i + 1),
  );

  constructor() {
    this.cargar();
  }

  protected cargar(): void {
    this.cargando.set(true);

    this.api
      .getPaginado<Medio>('/admin/media', {
        pagina: this.pagina(),
        por_pagina: 36,
        q: this.busqueda(),
      })
      .subscribe({
        next: ({ datos, meta }) => {
          this.medios.set(datos);
          this.meta.set(meta);
          this.cargando.set(false);
        },
        error: (error) => {
          this.cargando.set(false);
          this.avisos.error(mensajeDeError(error));
        },
      });
  }

  protected buscar(evento: Event): void {
    this.busqueda.set((evento.target as HTMLInputElement).value);
    this.pagina.set(1);
    this.cargar();
  }

  protected irAPagina(numero: number): void {
    this.pagina.set(numero);
    this.cargar();
  }

  protected subir(evento: Event): void {
    const entrada = evento.target as HTMLInputElement;
    const archivos = Array.from(entrada.files ?? []);

    if (archivos.length === 0) {
      return;
    }

    this.subiendo.set(true);
    let pendientes = archivos.length;

    const terminar = (): void => {
      pendientes -= 1;
      if (pendientes === 0) {
        this.subiendo.set(false);
        entrada.value = '';
        this.cargar();
      }
    };

    for (const archivo of archivos) {
      this.api.subir<Medio>('/admin/media', archivo).subscribe({
        next: () => terminar(),
        error: (error) => {
          this.avisos.error(`${archivo.name}: ${mensajeDeError(error)}`);
          terminar();
        },
      });
    }
  }

  protected abrirDetalle(medio: Medio): void {
    this.detalle.set(medio);
    this.altEditado.set(medio.alt);
  }

  protected guardarAlt(): void {
    const medio = this.detalle();

    if (!medio) {
      return;
    }

    this.api.put<Medio>(`/admin/media/${medio.id}`, { alt: this.altEditado() }).subscribe({
      next: (actualizado) => {
        this.detalle.set(null);
        this.avisos.exito('Texto alternativo guardado.');
        this.medios.update((lista) => lista.map((m) => (m.id === actualizado.id ? actualizado : m)));
      },
      error: (error) => this.avisos.error(mensajeDeError(error)),
    });
  }

  protected eliminar(forzar = false): void {
    const medio = this.confirmando();

    if (!medio) {
      return;
    }

    this.api.delete(`/admin/media/${medio.id}`, forzar ? { forzar: 1 } : undefined).subscribe({
      next: () => {
        this.confirmando.set(null);
        this.detalle.set(null);
        this.avisos.exito('Archivo eliminado.');
        this.cargar();
      },
      error: (error) => {
        this.avisos.error(mensajeDeError(error));
        this.confirmando.set(null);
      },
    });
  }

  protected copiarUrl(medio: Medio): void {
    navigator.clipboard?.writeText(medio.url).then(
      () => this.avisos.exito('Direccion copiada al portapapeles.'),
      () => this.avisos.error('No se pudo copiar la direccion.'),
    );
  }
}
