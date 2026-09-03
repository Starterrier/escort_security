/**
 * Contratos de datos que devuelve la API PHP.
 */

/** Envoltura estandar de toda respuesta correcta. */
export interface RespuestaApi<T> {
  ok: true;
  datos: T;
  meta?: MetaPaginacion;
}

export interface MetaPaginacion {
  total: number;
  pagina: number;
  por_pagina: number;
  paginas: number;
}

/** Envoltura de error. */
export interface ErrorApi {
  ok: false;
  mensaje: string;
  errores?: Record<string, string>;
}

export interface Medio {
  id: number;
  url: string;
  archivo: string;
  nombre_original: string;
  mime: string;
  peso: number;
  ancho: number | null;
  alto: number | null;
  alt: string;
  creado_en?: string;
}

export interface Servicio {
  id: number;
  slug: string;
  titulo: string;
  categoria: string;
  resumen: string;
  descripcion?: string | null;
  icono: string;
  imagen_id: number | null;
  imagen: Medio | null;
  destacado: boolean | number;
  orden: number;
  activo?: number;
  items: string[];
  meta_titulo?: string;
  meta_descripcion?: string;
}

export interface Sector {
  id: number;
  slug: string;
  nombre: string;
  descripcion: string;
  icono: string;
  imagen_id: number | null;
  imagen: Medio | null;
  orden?: number;
  activo?: number;
}

export interface Slide {
  id: number;
  titulo: string;
  subtitulo: string;
  texto: string | null;
  cta_texto: string;
  cta_url: string;
  imagen_id: number | null;
  imagen: Medio | null;
  orden?: number;
  activo?: number;
}

export interface Pagina {
  id: number;
  slug: string;
  titulo: string;
  subtitulo: string;
  contenido: string | null;
  imagen_id: number | null;
  imagen?: Medio | null;
  meta_titulo: string;
  meta_descripcion: string;
  sistema?: number;
  en_menu?: number;
  orden?: number;
  activo?: number;
}

export interface EnlaceMenu {
  etiqueta: string;
  ruta: string;
}

export interface Cifra {
  valor: string;
  etiqueta: string;
}

/** Ajustes del sitio ya resueltos (los `media` vienen como URL). */
export interface AjustesSitio {
  sitio_nombre: string;
  sitio_razon_social: string;
  sitio_eslogan: string;
  sitio_logo: string;
  sitio_logo_claro: string;
  sitio_favicon: string;
  sitio_licencia: string;
  sitio_nit: string;

  color_primario: string;
  color_secundario: string;
  color_acento: string;
  color_texto: string;
  color_fondo: string;
  color_fondo_alt: string;
  tipografia: string;
  radio_bordes: string;

  contacto_telefono: string;
  contacto_whatsapp: string;
  contacto_email: string;
  contacto_direccion: string;
  contacto_ciudad: string;
  contacto_horario: string;
  contacto_mapa: string;

  red_facebook: string;
  red_instagram: string;
  red_linkedin: string;
  red_youtube: string;

  home_intro_titulo: string;
  home_intro_texto: string;
  home_cifras: Cifra[];
  home_cta_titulo: string;
  home_cta_texto: string;
  portafolio_url: string;

  seo_titulo: string;
  seo_descripcion: string;
  seo_imagen: string;
  seo_analytics: string;

  whatsapp_url: string;
  telefono_url: string;
}

export interface BootstrapSitio {
  ajustes: AjustesSitio;
  slides: Slide[];
  servicios: Servicio[];
  sectores: Sector[];
  menu: EnlaceMenu[];
}

export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  rol: 'admin' | 'editor';
  activo?: number;
  ultimo_acceso?: string | null;
  creado_en?: string;
}

export interface Sesion {
  token: string;
  expira: number;
  usuario: Usuario;
}

export type EstadoSolicitud = 'nueva' | 'en_gestion' | 'atendida' | 'descartada';

export interface Solicitud {
  id: number;
  nombre: string;
  email: string;
  telefono: string;
  empresa: string;
  ciudad: string;
  servicio_id: number | null;
  servicio_titulo: string | null;
  mensaje: string;
  estado: EstadoSolicitud;
  notas: string | null;
  ip: string;
  user_agent: string;
  creado_en: string;
}

export interface CampoAjuste {
  clave: string;
  etiqueta: string;
  tipo: 'texto' | 'numero' | 'booleano' | 'json' | 'color' | 'media';
  ayuda: string;
  valor: unknown;
}

export interface AjustesPanel {
  grupos: Record<string, CampoAjuste[]>;
  valores: Record<string, unknown>;
}

export interface ResumenPanel {
  conteos: {
    servicios: number;
    servicios_totales: number;
    sectores: number;
    paginas: number;
    slides: number;
    medios: number;
    solicitudes_nuevas: number;
    solicitudes_totales: number;
  };
  ultimas_solicitudes: Array<Pick<Solicitud, 'id' | 'nombre' | 'email' | 'empresa' | 'estado' | 'creado_en'>>;
  serie_solicitudes: Array<{ dia: string; total: number }>;
}
