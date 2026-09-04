import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { IconoComponent } from '../../compartido/componentes/icono.component';
import { SitioService } from '../../core/servicios/sitio.service';
import { CabeceraComponent } from './cabecera.component';
import { PieComponent } from './pie.component';

/**
 * Marco del sitio publico: cabecera, contenido, pie y acceso rapido a WhatsApp.
 */
@Component({
  selector: 'app-publico-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, CabeceraComponent, PieComponent, IconoComponent],
  template: `
    <a href="#contenido" class="salto-contenido">Saltar al contenido</a>

    <app-cabecera />

    <main id="contenido">
      <router-outlet />
    </main>

    <app-pie />

    @if (sitio.ajustes().whatsapp_url) {
      <a
        class="whatsapp"
        [href]="sitio.ajustes().whatsapp_url"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Escribirnos por WhatsApp"
      >
        <app-icono nombre="whatsapp" [tamano]="28" />
        <span>Escribenos</span>
      </a>
    }
  `,
  styles: `
    main {
      display: block;
      min-height: 60vh;
    }

    .whatsapp {
      position: fixed;
      right: 22px;
      bottom: 22px;
      z-index: 90;
      display: inline-flex;
      align-items: center;
      gap: 10px;
      padding: 13px 20px;
      border-radius: 999px;
      background: #25d366;
      color: #fff;
      font-weight: 700;
      font-size: 0.9rem;
      box-shadow: 0 12px 30px rgba(37, 211, 102, 0.4);
      /* Entra con un segundo de retraso: si aparece a la vez que la
         portada, tapa el titular justo cuando se esta leyendo. */
      animation: subir 0.5s var(--rebote) 1s both;
      transition:
        transform 0.2s ease,
        box-shadow 0.2s ease;

      &:hover {
        color: #fff;
        transform: translateY(-3px);
        box-shadow: 0 16px 38px rgba(37, 211, 102, 0.5);
      }

      /* Halo que se expande en bucle, en el verde del propio boton y no en
         el azul del sitio. Va en un ::after para que el pulso no herede la
         transicion de :hover del boton. */
      &::after {
        content: '';
        position: absolute;
        inset: 0;
        border-radius: inherit;
        animation: pulso-whatsapp 2.6s ease-out infinite;
        pointer-events: none;
      }

      /* Parado mientras el cursor esta encima: dos animaciones a la vez
         sobre el mismo boton se leen como un fallo, no como un detalle. */
      &:hover::after {
        animation-play-state: paused;
      }
    }

    @keyframes pulso-whatsapp {
      0% {
        box-shadow: 0 0 0 0 rgba(37, 211, 102, 0.55);
      }
      70% {
        box-shadow: 0 0 0 16px rgba(37, 211, 102, 0);
      }
      100% {
        box-shadow: 0 0 0 0 rgba(37, 211, 102, 0);
      }
    }

    @media (max-width: 600px) {
      .whatsapp {
        right: 16px;
        bottom: 16px;
        padding: 14px;

        span {
          display: none;
        }
      }
    }
  `,
})
export class PublicoLayout {
  protected readonly sitio = inject(SitioService);
}
