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
      transition: transform 0.2s ease;

      &:hover {
        color: #fff;
        transform: translateY(-3px);
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
