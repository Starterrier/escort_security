import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { IconoComponent } from '../../compartido/componentes/icono.component';
import { SitioService } from '../../core/servicios/sitio.service';

@Component({
  selector: 'app-pie',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, IconoComponent],
  templateUrl: './pie.component.html',
  styleUrl: './pie.component.scss',
})
export class PieComponent {
  protected readonly sitio = inject(SitioService);
  protected readonly anio = new Date().getFullYear();

  /** Solo los primeros seis servicios, para no alargar el pie. */
  protected readonly serviciosPie = computed(() => this.sitio.servicios().slice(0, 6));

  protected readonly redes = computed(() => {
    const a = this.sitio.ajustes();

    return [
      { nombre: 'Facebook', url: a.red_facebook },
      { nombre: 'Instagram', url: a.red_instagram },
      { nombre: 'LinkedIn', url: a.red_linkedin },
      { nombre: 'YouTube', url: a.red_youtube },
    ].filter((r) => Boolean(r.url));
  });
}
