import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { IconoComponent } from '../../compartido/componentes/icono.component';
import { EstadoSolicitud, MetaPaginacion, Solicitud } from '../../core/modelos/api.modelos';
import { mensajeDeError } from '../../core/interceptores/errores';
import { ApiService } from '../../core/servicios/api.service';
import { AvisosService } from '../../core/servicios/avisos.service';

const ETIQUETAS_ESTADO: Record<EstadoSolicitud, string> = {
  nueva: 'Nueva',
  en_gestion: 'En gestion',
  atendida: 'Atendida',
  descartada: 'Descartada',
};

@Component({
  selector: 'app-solicitudes-admin',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, DatePipe, IconoComponent],
  templateUrl: './solicitudes-admin.page.html',
  styleUrl: './solicitudes-admin.page.scss',
})
export class SolicitudesAdminPage {
  private readonly api = inject(ApiService);
  private readonly avisos = inject(AvisosService);

  protected readonly estados: EstadoSolicitud[] = ['nueva', 'en_gestion', 'atendida', 'descartada'];
  protected readonly etiquetas = ETIQUETAS_ESTADO;

  protected readonly solicitudes = signal<Solicitud[]>([]);
  protected readonly meta = signal<MetaPaginacion | null>(null);
  protected readonly cargando = signal(true);
  protected readonly filtroEstado = signal<string>('');
  protected readonly busqueda = signal('');
  protected readonly pagina = signal(1);
  protected readonly detalle = signal<Solicitud | null>(null);
  protected readonly notasEditadas = signal('');
  protected readonly confirmando = signal<Solicitud | null>(null);

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
      .getPaginado<Solicitud>('/admin/solicitudes', {
        pagina: this.pagina(),
        por_pagina: 20,
        estado: this.filtroEstado(),
        q: this.busqueda(),
      })
      .subscribe({
        next: ({ datos, meta }) => {
          this.solicitudes.set(datos);
          this.meta.set(meta);
          this.cargando.set(false);
        },
        error: (error) => {
          this.cargando.set(false);
          this.avisos.error(mensajeDeError(error));
        },
      });
  }

  protected filtrarPorEstado(estado: string): void {
    this.filtroEstado.set(estado);
    this.pagina.set(1);
    this.cargar();
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

  protected abrir(solicitud: Solicitud): void {
    this.detalle.set(solicitud);
    this.notasEditadas.set(solicitud.notas ?? '');
  }

  protected cambiarEstado(solicitud: Solicitud, estado: EstadoSolicitud): void {
    this.api.patch<Solicitud>(`/admin/solicitudes/${solicitud.id}`, { estado }).subscribe({
      next: (actualizada) => {
        this.solicitudes.update((lista) =>
          lista.map((s) => (s.id === actualizada.id ? actualizada : s)),
        );
        if (this.detalle()?.id === actualizada.id) {
          this.detalle.set(actualizada);
        }
        this.avisos.exito('Estado actualizado.');
      },
      error: (error) => this.avisos.error(mensajeDeError(error)),
    });
  }

  protected guardarNotas(): void {
    const solicitud = this.detalle();

    if (!solicitud) {
      return;
    }

    this.api
      .patch<Solicitud>(`/admin/solicitudes/${solicitud.id}`, { notas: this.notasEditadas() })
      .subscribe({
        next: (actualizada) => {
          this.detalle.set(actualizada);
          this.solicitudes.update((lista) =>
            lista.map((s) => (s.id === actualizada.id ? actualizada : s)),
          );
          this.avisos.exito('Notas guardadas.');
        },
        error: (error) => this.avisos.error(mensajeDeError(error)),
      });
  }

  protected eliminar(): void {
    const solicitud = this.confirmando();

    if (!solicitud) {
      return;
    }

    this.api.delete(`/admin/solicitudes/${solicitud.id}`).subscribe({
      next: () => {
        this.confirmando.set(null);
        this.detalle.set(null);
        this.avisos.exito('Solicitud eliminada.');
        this.cargar();
      },
      error: (error) => {
        this.confirmando.set(null);
        this.avisos.error(mensajeDeError(error));
      },
    });
  }

  protected enlaceCorreo(solicitud: Solicitud): string {
    const asunto = encodeURIComponent('Su solicitud a Escort Security Services');

    return `mailto:${solicitud.email}?subject=${asunto}`;
  }
}
