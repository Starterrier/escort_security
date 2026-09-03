import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/**
 * Iconos SVG en linea (trazo, sin dependencias externas).
 *
 * El panel guarda solo el nombre del icono; si no existe se dibuja el escudo.
 */
const TRAZOS: Record<string, string> = {
  // Servicios
  shield: 'M12 3 4 6v6c0 5 3.4 8.4 8 9 4.6-.6 8-4 8-9V6l-8-3Z',
  radar: 'M12 3a9 9 0 1 0 9 9M12 7a5 5 0 1 0 5 5M12 12l7-7',
  clipboard: 'M9 4h6v3H9zM8 5H6a1 1 0 0 0-1 1v13a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1h-2M9 12h6M9 16h4',
  search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14ZM16 16l4 4',
  'file-search': 'M14 3H7a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V7l-4-4ZM13 3v5h5M11 12a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5ZM13 16l2 2',
  briefcase: 'M4 8h16a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1ZM9 8V6a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M3 13h18',
  graduation: 'M12 4 2 9l10 5 10-5-10-5ZM6 12v5c0 1.5 2.7 3 6 3s6-1.5 6-3v-5',
  lock: 'M7 11V8a5 5 0 0 1 10 0v3M5 11h14v9H5zM12 15v2',

  // Sectores
  home: 'M4 11 12 4l8 7M6 10v10h12V10M10 20v-6h4v6',
  bank: 'M3 10 12 4l9 6M5 10v9M9 10v9M15 10v9M19 10v9M3 20h18',
  hospital: 'M5 20V7l7-4 7 4v13M3 20h18M12 9v6M9 12h6',
  fuel: 'M4 20V5a1 1 0 0 1 1-1h7a1 1 0 0 1 1 1v15M3 20h12M6 9h6M15 9h3a1 1 0 0 1 1 1v6a2 2 0 0 0 2-2v-4l-3-4',
  store: 'M4 9h16l-1-4H5L4 9ZM5 9v11h14V9M9 20v-6h6v6',
  anchor: 'M12 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM12 7v14M5 13a7 7 0 0 0 14 0M8 11H5M19 11h-3',
  truck: 'M3 7h11v10H3zM14 10h4l3 3v4h-7zM7 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM17.5 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z',
  mountain: 'M3 19 10 6l4 7 2-3 5 9H3ZM10 6l4 7',
  factory: 'M3 20V10l5 3V10l5 3V7l6 4v9H3ZM7 16h2M13 16h2',
  wheat: 'M12 21V9M12 9c0-2 1-4 3-5 0 2.5-1 4.5-3 5ZM12 9c0-2-1-4-3-5 0 2.5 1 4.5 3 5ZM12 14c0-2 1-4 3-5 0 2.5-1 4.5-3 5ZM12 14c0-2-1-4-3-5 0 2.5 1 4.5 3 5Z',
  building: 'M5 21V4a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v17M3 21h18M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2',

  // Interfaz
  telefono: 'M6 3h4l2 5-2.5 1.5a12 12 0 0 0 5 5L16 12l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 4 5a2 2 0 0 1 2-2Z',
  correo: 'M3 6h18v12H3zM3 7l9 6 9-6',
  ubicacion: 'M12 21s7-6 7-11a7 7 0 1 0-14 0c0 5 7 11 7 11ZM12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z',
  reloj: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 7v5l3 2',
  whatsapp:
    'M20 12a8 8 0 0 1-11.9 7L4 20l1.1-4A8 8 0 1 1 20 12ZM9 9c0 3 3 6 6 6 .8 0 1.5-.7 1.5-1.5L14 12l-1 1c-1 0-2-1-2-2l1-1-1.5-2.5C9.7 7.5 9 8.2 9 9Z',
  flecha: 'M5 12h14M13 6l6 6-6 6',
  cheque: 'M20 6 9 17l-5-5',
  menu: 'M4 7h16M4 12h16M4 17h16',
  cerrar: 'M6 6l12 12M18 6 6 18',
  descargar: 'M12 4v11M8 11l4 4 4-4M5 20h14',
  panel: 'M4 4h7v7H4zM13 4h7v4h-7zM13 10h7v10h-7zM4 13h7v7H4z',
  imagen: 'M4 5h16v14H4zM8.5 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM4 16l4.5-4.5L13 16l3-3 4 4',
  ajustes:
    'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.4-2.3 1a7 7 0 0 0-2-1.2L14.2 3H9.8l-.4 2.7a7 7 0 0 0-2 1.2l-2.3-1-2 3.4 2 1.5A7 7 0 0 0 5 12c0 .4 0 .8.1 1.2l-2 1.5 2 3.4 2.3-1a7 7 0 0 0 2 1.2l.4 2.7h4.4l.4-2.7a7 7 0 0 0 2-1.2l2.3 1 2-3.4-2-1.5c.1-.4.1-.8.1-1.2Z',
  usuarios: 'M9 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM2 20c0-3.3 3.1-5 7-5s7 1.7 7 5M17 5a3.5 3.5 0 0 1 0 7M18 15c2.5.5 4 1.9 4 4',
  bandeja: 'M3 13h5l1 3h6l1-3h5M3 13l2-8h14l2 8v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-6Z',
  documento: 'M14 3H7a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V7l-4-4ZM13 3v5h5M9 13h6M9 17h4',
  carrusel: 'M8 6h8v12H8zM4 8v8M20 8v8',
  mas: 'M12 5v14M5 12h14',
  editar: 'M4 20h4L20 8l-4-4L4 16v4ZM14 6l4 4',
  basura: 'M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13M10 11v6M14 11v6',
  arriba: 'M12 19V5M6 11l6-6 6 6',
  abajo: 'M12 5v14M6 13l6 6 6-6',
  salir: 'M15 4h3a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-3M10 8l-4 4 4 4M6 12h10',
  alerta: 'M12 4 2 20h20L12 4ZM12 10v4M12 17v.5',
};

@Component({
  selector: 'app-icono',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg
      [attr.width]="tamano()"
      [attr.height]="tamano()"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      [attr.stroke-width]="grosor()"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path [attr.d]="trazo()" />
    </svg>
  `,
  styles: `
    :host {
      display: inline-flex;
      line-height: 0;
    }
  `,
})
export class IconoComponent {
  readonly nombre = input.required<string>();
  readonly tamano = input(24);
  readonly grosor = input(1.7);

  protected readonly trazo = computed(() => TRAZOS[this.nombre()] ?? TRAZOS['shield']);
}

/** Nombres disponibles, para el selector de icono del panel. */
export const ICONOS_DISPONIBLES = Object.keys(TRAZOS);
