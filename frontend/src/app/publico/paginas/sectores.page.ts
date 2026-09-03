import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { EncabezadoPaginaComponent } from '../../compartido/componentes/encabezado-pagina.component';
import { IconoComponent } from '../../compartido/componentes/icono.component';
import { SeoService } from '../../core/servicios/seo.service';
import { SitioService } from '../../core/servicios/sitio.service';

@Component({
  selector: 'app-sectores',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, IconoComponent, EncabezadoPaginaComponent],
  template: `
    <app-encabezado-pagina
      titulo="Sectores que atendemos"
      subtitulo="Cada industria tiene amenazas propias. Adaptamos el esquema de proteccion a la operacion real de su sector."
    />

    <section class="seccion">
      <div class="contenedor">
        <div class="rejilla">
          @for (sector of sitio.sectores(); track sector.id) {
            <article class="tarjeta-sector">
              @if (sector.imagen?.url) {
                <img
                  [src]="sector.imagen!.url"
                  [alt]="sector.imagen!.alt || sector.nombre"
                  loading="lazy"
                />
              } @else {
                <span class="tarjeta-sector__icono">
                  <app-icono [nombre]="sector.icono" [tamano]="30" />
                </span>
              }

              <div class="tarjeta-sector__cuerpo">
                <h2>{{ sector.nombre }}</h2>
                <p>{{ sector.descripcion }}</p>
              </div>
            </article>
          } @empty {
            <p>No hay sectores publicados.</p>
          }
        </div>
      </div>
    </section>

    <section class="seccion seccion--alt">
      <div class="contenedor cierre">
        <h2>Su sector no aparece en la lista?</h2>
        <p class="entradilla">
          Trabajamos con operaciones de todos los tamanos. Cuentenos su caso y evaluamos el riesgo.
        </p>
        <a routerLink="/contacto" class="boton boton--primario">Solicitar asesoria</a>
      </div>
    </section>
  `,
  styles: `
    .rejilla {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(270px, 1fr));
      gap: 24px;
    }

    .tarjeta-sector {
      overflow: hidden;
      background: #fff;
      border: 1px solid var(--borde);
      border-radius: var(--radio);
      transition:
        transform 0.22s ease,
        box-shadow 0.22s ease;

      &:hover {
        transform: translateY(-4px);
        box-shadow: var(--sombra-lg);
      }

      img {
        width: 100%;
        height: 180px;
        object-fit: cover;
      }

      &__icono {
        display: grid;
        place-items: center;
        height: 130px;
        background: var(--color-primario);
        color: var(--color-acento);
      }

      &__cuerpo {
        padding: 24px 24px 28px;
      }

      h2 {
        margin-bottom: 8px;
        font-size: 1.16rem;
        color: var(--color-primario);
      }

      p {
        margin: 0;
        font-size: 0.92rem;
        color: var(--texto-suave);
      }
    }

    .cierre {
      text-align: center;

      .entradilla {
        max-width: 58ch;
        margin-inline: auto;
        margin-bottom: 26px;
      }
    }
  `,
})
export class SectoresPage implements OnInit {
  protected readonly sitio = inject(SitioService);
  private readonly seo = inject(SeoService);

  ngOnInit(): void {
    this.seo.aplicar({
      titulo: 'Sectores',
      descripcion:
        'Seguridad privada para los sectores residencial, bancario, hospitalario, hidrocarburos, comercial, portuario, transporte, mineria, industrial y agroindustrial.',
      ruta: '/sectores',
    });
  }
}
