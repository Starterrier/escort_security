import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { IconoComponent } from '../../compartido/componentes/icono.component';
import { ResumenPanel } from '../../core/modelos/api.modelos';
import { mensajeDeError } from '../../core/interceptores/errores';
import { ApiService } from '../../core/servicios/api.service';
import { AuthService } from '../../core/servicios/auth.service';
import { AvisosService } from '../../core/servicios/avisos.service';

@Component({
  selector: 'app-tablero',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, DatePipe, IconoComponent],
  templateUrl: './tablero.page.html',
  styleUrl: './tablero.page.scss',
})
export class TableroPage {
  private readonly api = inject(ApiService);
  private readonly avisos = inject(AvisosService);
  protected readonly auth = inject(AuthService);

  protected readonly resumen = signal<ResumenPanel | null>(null);
  protected readonly cargando = signal(true);

  /** Altura relativa de cada barra del grafico de solicitudes. */
  protected readonly barras = computed(() => {
    const serie = this.resumen()?.serie_solicitudes ?? [];
    const maximo = Math.max(1, ...serie.map((p) => p.total));

    return serie.map((punto) => ({
      ...punto,
      altura: Math.round((punto.total / maximo) * 100),
    }));
  });

  protected readonly tarjetas = computed(() => {
    const c = this.resumen()?.conteos;

    if (!c) {
      return [];
    }

    return [
      { etiqueta: 'Solicitudes nuevas', valor: c.solicitudes_nuevas, icono: 'bandeja', ruta: '/admin/solicitudes', destacar: c.solicitudes_nuevas > 0 },
      { etiqueta: 'Servicios publicados', valor: c.servicios, icono: 'shield', ruta: '/admin/servicios', destacar: false },
      { etiqueta: 'Sectores', valor: c.sectores, icono: 'building', ruta: '/admin/sectores', destacar: false },
      { etiqueta: 'Imagenes', valor: c.medios, icono: 'imagen', ruta: '/admin/medios', destacar: false },
    ];
  });

  constructor() {
    this.cargar();
  }

  private cargar(): void {
    this.api.get<ResumenPanel>('/admin/resumen').subscribe({
      next: (datos) => {
        this.resumen.set(datos);
        this.cargando.set(false);
      },
      error: (error) => {
        this.cargando.set(false);
        this.avisos.error(mensajeDeError(error));
      },
    });
  }
}
