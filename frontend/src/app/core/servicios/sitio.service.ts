import { DOCUMENT } from '@angular/common';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';

import { AjustesSitio, BootstrapSitio, EnlaceMenu, Sector, Servicio, Slide } from '../modelos/api.modelos';
import { ApiService } from './api.service';

/** Valores usados mientras la API responde o si no esta disponible. */
const AJUSTES_POR_DEFECTO: AjustesSitio = {
  sitio_nombre: 'Escort Security Services',
  sitio_razon_social: 'Escort Security Services Ltda.',
  sitio_eslogan: 'Profesionales al servicio de su tranquilidad',
  sitio_logo: '',
  sitio_logo_claro: '',
  sitio_favicon: '',
  sitio_licencia: 'Vigilado Supervigilancia',
  sitio_nit: '',
  color_primario: '#0b1e3c',
  color_secundario: '#3d8fd8',
  color_acento: '#63b3ed',
  color_texto: '#0f172a',
  color_fondo: '#ffffff',
  color_fondo_alt: '#f1f5f9',
  tipografia: 'Barlow',
  radio_bordes: '14px',
  contacto_telefono: '601 749 5172',
  contacto_whatsapp: '573124731224',
  contacto_email: 'comercial@essltda.com',
  contacto_direccion: 'Calle 57 # 24-22',
  contacto_ciudad: 'Bogota D.C., Colombia',
  contacto_horario: 'Lunes a viernes, 9:00 a.m. - 6:00 p.m.',
  contacto_mapa: '',
  red_facebook: '',
  red_instagram: '',
  red_linkedin: '',
  red_youtube: '',
  home_intro_titulo: '',
  home_intro_texto: '',
  home_cifras: [],
  home_cta_titulo: '',
  home_cta_texto: '',
  portafolio_url: '',
  seo_titulo: 'Escort Security Services',
  seo_descripcion: '',
  seo_imagen: '',
  seo_analytics: '',
  whatsapp_url: '',
  telefono_url: '',
};

/**
 * Contenido y apariencia del sitio publico.
 *
 * Se carga una sola vez con `/publico/bootstrap` y aplica los colores del
 * panel como variables CSS, de modo que cambiar la paleta desde el admin
 * repinta todo el sitio sin tocar codigo.
 */
@Injectable({ providedIn: 'root' })
export class SitioService {
  private readonly api = inject(ApiService);
  private readonly documento = inject(DOCUMENT);

  private readonly _ajustes = signal<AjustesSitio>(AJUSTES_POR_DEFECTO);
  private readonly _slides = signal<Slide[]>([]);
  private readonly _servicios = signal<Servicio[]>([]);
  private readonly _sectores = signal<Sector[]>([]);
  private readonly _menu = signal<EnlaceMenu[]>([]);
  private readonly _cargado = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly ajustes = this._ajustes.asReadonly();
  readonly slides = this._slides.asReadonly();
  readonly servicios = this._servicios.asReadonly();
  readonly sectores = this._sectores.asReadonly();
  readonly menu = this._menu.asReadonly();
  readonly cargado = this._cargado.asReadonly();
  readonly error = this._error.asReadonly();

  readonly destacados = computed(() => this._servicios().filter((s) => Boolean(s.destacado)));

  cargar(): Observable<BootstrapSitio> {
    return this.api.get<BootstrapSitio>('/publico/bootstrap').pipe(
      tap({
        next: (datos) => {
          this._ajustes.set({ ...AJUSTES_POR_DEFECTO, ...datos.ajustes });
          this._slides.set(datos.slides);
          this._servicios.set(datos.servicios);
          this._sectores.set(datos.sectores);
          this._menu.set(datos.menu);
          this._cargado.set(true);
          this._error.set(null);
          this.aplicarApariencia();
        },
        error: () => {
          this._error.set('No fue posible cargar el contenido del sitio.');
          this._cargado.set(true);
        },
      }),
    );
  }

  /** Relee el bootstrap tras guardar cambios en el panel. */
  refrescar(): void {
    this.cargar().subscribe({ error: () => undefined });
  }

  servicioPorSlug(slug: string): Servicio | undefined {
    return this._servicios().find((s) => s.slug === slug);
  }

  /** Vuelca los ajustes de apariencia en variables CSS de :root. */
  aplicarApariencia(): void {
    const a = this._ajustes();
    const raiz = this.documento.documentElement;

    const variables: Record<string, string> = {
      '--color-primario': a.color_primario,
      '--color-secundario': a.color_secundario,
      '--color-acento': a.color_acento,
      '--color-texto': a.color_texto,
      '--color-fondo': a.color_fondo,
      '--color-fondo-alt': a.color_fondo_alt,
      '--radio': a.radio_bordes,
      '--primario-rgb': this.aRgb(a.color_primario),
      '--secundario-rgb': this.aRgb(a.color_secundario),
    };

    for (const [nombre, valor] of Object.entries(variables)) {
      if (valor) {
        raiz.style.setProperty(nombre, valor);
      }
    }

    this.cargarTipografia(a.tipografia);
    this.aplicarFavicon(a.sitio_favicon);
  }

  /** "#0b1e3c" -> "11, 30, 60" para usarlo en rgba(). */
  private aRgb(hex: string): string {
    const limpio = (hex || '').replace('#', '');

    if (limpio.length !== 3 && limpio.length !== 6) {
      return '';
    }

    const completo =
      limpio.length === 3
        ? limpio
            .split('')
            .map((c) => c + c)
            .join('')
        : limpio;

    const entero = Number.parseInt(completo, 16);

    return `${(entero >> 16) & 255}, ${(entero >> 8) & 255}, ${entero & 255}`;
  }

  private cargarTipografia(nombre: string): void {
    if (!nombre) {
      return;
    }

    const familia = nombre.trim().replace(/\s+/g, '+');
    const id = 'ess-tipografia';
    const href = `https://fonts.googleapis.com/css2?family=${familia}:wght@400;500;600;700;800&display=swap`;

    let enlace = this.documento.getElementById(id) as HTMLLinkElement | null;

    if (!enlace) {
      enlace = this.documento.createElement('link');
      enlace.id = id;
      enlace.rel = 'stylesheet';
      this.documento.head.appendChild(enlace);
    }

    if (enlace.href !== href) {
      enlace.href = href;
    }

    this.documento.documentElement.style.setProperty(
      '--fuente',
      `'${nombre.trim()}', 'Segoe UI', system-ui, -apple-system, sans-serif`,
    );
  }

  private aplicarFavicon(url: string): void {
    if (!url) {
      return;
    }

    let enlace = this.documento.querySelector<HTMLLinkElement>('link[rel="icon"]');

    if (!enlace) {
      enlace = this.documento.createElement('link');
      enlace.rel = 'icon';
      this.documento.head.appendChild(enlace);
    }

    enlace.href = url;
  }
}
