import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, map, of, switchMap, tap } from 'rxjs';

import { EncabezadoPaginaComponent } from '../../compartido/componentes/encabezado-pagina.component';
import { Pagina } from '../../core/modelos/api.modelos';
import { ApiService } from '../../core/servicios/api.service';
import { SeoService } from '../../core/servicios/seo.service';

/**
 * Renderiza cualquier pagina de contenido creada desde el panel.
 *
 * Se usa tanto en /nosotros (slug fijo por la ruta) como en /pagina/:slug.
 */
@Component({
  selector: 'app-pagina',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, EncabezadoPaginaComponent],
  template: `
    @if (noEncontrada()) {
      <app-encabezado-pagina titulo="Pagina no disponible" />

      <section class="seccion">
        <div class="contenedor aviso">
          <p class="entradilla">La pagina que busca no existe o fue despublicada.</p>
          <a routerLink="/" class="boton boton--primario">Volver al inicio</a>
        </div>
      </section>
    } @else if (pagina(); as p) {
      <app-encabezado-pagina
        [titulo]="p.titulo"
        [subtitulo]="p.subtitulo"
        [imagen]="p.imagen?.url ?? ''"
      />

      <section class="seccion">
        <div class="contenedor">
          <article class="contenido-rico articulo" [innerHTML]="p.contenido"></article>
        </div>
      </section>
    } @else {
      <div class="aviso"><p>Cargando...</p></div>
    }
  `,
  styles: `
    .articulo {
      max-width: 80ch;
      margin-inline: auto;
      font-size: 1.06rem;
    }

    .aviso {
      padding: 80px 24px;
      text-align: center;
      color: var(--texto-tenue);
    }
  `,
})
export class PaginaPage {
  private readonly ruta = inject(ActivatedRoute);
  private readonly api = inject(ApiService);
  private readonly seo = inject(SeoService);

  protected readonly noEncontrada = signal(false);

  protected readonly pagina = toSignal(
    this.ruta.paramMap.pipe(
      // El slug puede venir del parametro de ruta o fijado en `data`.
      map((parametros) => parametros.get('slug') ?? this.ruta.snapshot.data['slug'] ?? ''),
      switchMap((slug: string) =>
        this.api.get<Pagina>(`/publico/paginas/${slug}`).pipe(
          tap((p) => {
            this.noEncontrada.set(false);
            this.seo.aplicar({
              titulo: p.meta_titulo || p.titulo,
              descripcion: p.meta_descripcion || p.subtitulo,
              imagen: p.imagen?.url,
              ruta: `/pagina/${p.slug}`,
              tipo: 'article',
            });
          }),
          catchError(() => {
            this.noEncontrada.set(true);

            return of(null);
          }),
        ),
      ),
    ),
    { initialValue: null },
  );
}
