import { ChangeDetectionStrategy, Component, HostListener, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

import { IconoComponent } from '../../compartido/componentes/icono.component';
import { SitioService } from '../../core/servicios/sitio.service';

@Component({
  selector: 'app-cabecera',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, IconoComponent],
  templateUrl: './cabecera.component.html',
  styleUrl: './cabecera.component.scss',
})
export class CabeceraComponent {
  private readonly router = inject(Router);
  protected readonly sitio = inject(SitioService);

  protected readonly menuAbierto = signal(false);
  protected readonly compacta = signal(false);

  constructor() {
    // Cierra el menu movil al cambiar de ruta.
    this.router.events.subscribe(() => this.menuAbierto.set(false));
  }

  @HostListener('window:scroll')
  protected alDesplazar(): void {
    this.compacta.set(window.scrollY > 24);
  }

  protected alternarMenu(): void {
    this.menuAbierto.update((abierto) => !abierto);
  }
}
