import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { SitioService } from './core/servicios/sitio.service';

/**
 * Raiz de la aplicacion. Carga una sola vez los ajustes y el contenido del
 * sitio antes de que las vistas los necesiten.
 */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: '<router-outlet />',
})
export class App implements OnInit {
  private readonly sitio = inject(SitioService);

  ngOnInit(): void {
    this.sitio.cargar().subscribe({ error: () => undefined });
  }
}
