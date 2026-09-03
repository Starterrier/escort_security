import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map, switchMap, catchError, of, tap } from 'rxjs';

import { EncabezadoPaginaComponent } from '../../compartido/componentes/encabezado-pagina.component';
import { IconoComponent } from '../../compartido/componentes/icono.component';
import { Servicio } from '../../core/modelos/api.modelos';
import { ApiService } from '../../core/servicios/api.service';
import { SeoService } from '../../core/servicios/seo.service';
import { SitioService } from '../../core/servicios/sitio.service';

interface RespuestaDetalle {
  servicio: Servicio;
  relacionados: Servicio[];
}

@Component({
  selector: 'app-servicio-detalle',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, IconoComponent, EncabezadoPaginaComponent],
  templateUrl: './servicio-detalle.page.html',
  styleUrl: './servicio-detalle.page.scss',
})
export class ServicioDetallePage {
  private readonly ruta = inject(ActivatedRoute);
  private readonly api = inject(ApiService);
  private readonly seo = inject(SeoService);
  protected readonly sitio = inject(SitioService);

  protected readonly noEncontrado = signal(false);

  protected readonly detalle = toSignal(
    this.ruta.paramMap.pipe(
      map((parametros) => parametros.get('slug') ?? ''),
      switchMap((slug) =>
        this.api.get<RespuestaDetalle>(`/publico/servicios/${slug}`).pipe(
          tap((datos) => {
            this.noEncontrado.set(false);
            this.seo.aplicar({
              titulo: datos.servicio.meta_titulo || datos.servicio.titulo,
              descripcion: datos.servicio.meta_descripcion || datos.servicio.resumen,
              imagen: datos.servicio.imagen?.url,
              ruta: `/servicios/${datos.servicio.slug}`,
              tipo: 'article',
            });
          }),
          catchError(() => {
            this.noEncontrado.set(true);

            return of(null);
          }),
        ),
      ),
    ),
    { initialValue: null },
  );
}
