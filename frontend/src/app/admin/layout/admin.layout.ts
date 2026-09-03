import { ChangeDetectionStrategy, Component, ViewEncapsulation, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { IconoComponent } from '../../compartido/componentes/icono.component';
import { AuthService } from '../../core/servicios/auth.service';
import { AvisosService } from '../../core/servicios/avisos.service';
import { SitioService } from '../../core/servicios/sitio.service';

interface EnlacePanel {
  ruta: string;
  etiqueta: string;
  icono: string;
  soloAdmin?: boolean;
}

/**
 * Marco del panel: barra lateral, cabecera y area de contenido.
 *
 * Usa encapsulacion `None` a proposito para que las paginas hijas compartan
 * los estilos de formulario y tabla definidos en admin.layout.scss.
 */
@Component({
  selector: 'app-admin-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, IconoComponent],
  templateUrl: './admin.layout.html',
  styleUrl: './admin.layout.scss',
})
export class AdminLayout {
  protected readonly auth = inject(AuthService);
  protected readonly avisos = inject(AvisosService);
  private readonly sitio = inject(SitioService);
  private readonly router = inject(Router);

  protected readonly lateralAbierto = signal(false);

  protected readonly enlaces: EnlacePanel[] = [
    { ruta: '/admin', etiqueta: 'Resumen', icono: 'panel' },
    { ruta: '/admin/servicios', etiqueta: 'Servicios', icono: 'shield' },
    { ruta: '/admin/sectores', etiqueta: 'Sectores', icono: 'building' },
    { ruta: '/admin/carrusel', etiqueta: 'Carrusel', icono: 'carrusel' },
    { ruta: '/admin/paginas', etiqueta: 'Paginas', icono: 'documento' },
    { ruta: '/admin/medios', etiqueta: 'Biblioteca', icono: 'imagen' },
    { ruta: '/admin/solicitudes', etiqueta: 'Solicitudes', icono: 'bandeja' },
    { ruta: '/admin/apariencia', etiqueta: 'Apariencia y ajustes', icono: 'ajustes' },
    { ruta: '/admin/usuarios', etiqueta: 'Usuarios', icono: 'usuarios', soloAdmin: true },
  ];

  constructor() {
    this.router.events.subscribe(() => this.lateralAbierto.set(false));
  }

  protected visible(enlace: EnlacePanel): boolean {
    return !enlace.soloAdmin || this.auth.esAdmin();
  }

  protected alternarLateral(): void {
    this.lateralAbierto.update((abierto) => !abierto);
  }

  /** Recarga el contenido publico para ver los cambios sin refrescar. */
  protected verSitio(): void {
    this.sitio.refrescar();
  }

  protected salir(): void {
    this.auth.salir();
  }
}
