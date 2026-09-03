import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

import { SitioService } from './sitio.service';

export interface DatosSeo {
  titulo?: string;
  descripcion?: string;
  imagen?: string;
  ruta?: string;
  tipo?: 'website' | 'article';
}

/**
 * Titulo, descripcion y etiquetas Open Graph de cada vista.
 */
@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly sitio = inject(SitioService);
  private readonly documento = inject(DOCUMENT);

  aplicar(datos: DatosSeo = {}): void {
    const ajustes = this.sitio.ajustes();

    const titulo = datos.titulo
      ? `${datos.titulo} | ${ajustes.sitio_nombre}`
      : ajustes.seo_titulo || ajustes.sitio_nombre;

    const descripcion = datos.descripcion || ajustes.seo_descripcion;
    const imagen = datos.imagen || ajustes.seo_imagen;
    const url = this.urlAbsoluta(datos.ruta);

    this.title.setTitle(titulo);

    this.definir('description', descripcion);
    this.definirPropiedad('og:title', titulo);
    this.definirPropiedad('og:description', descripcion);
    this.definirPropiedad('og:type', datos.tipo ?? 'website');
    this.definirPropiedad('og:site_name', ajustes.sitio_nombre);
    this.definirPropiedad('og:url', url);
    this.definirPropiedad('og:image', imagen);
    this.definir('twitter:card', imagen ? 'summary_large_image' : 'summary');
    this.definir('twitter:title', titulo);
    this.definir('twitter:description', descripcion);

    this.canonica(url);
  }

  /** Datos estructurados de la empresa, para los resultados de busqueda. */
  organizacion(): void {
    const a = this.sitio.ajustes();

    const esquema = {
      '@context': 'https://schema.org',
      '@type': 'SecurityService',
      name: a.sitio_razon_social || a.sitio_nombre,
      description: a.seo_descripcion,
      telephone: a.contacto_telefono,
      email: a.contacto_email,
      image: a.seo_imagen || a.sitio_logo || undefined,
      address: {
        '@type': 'PostalAddress',
        streetAddress: a.contacto_direccion,
        addressLocality: a.contacto_ciudad,
        addressCountry: 'CO',
      },
      openingHours: a.contacto_horario,
      sameAs: [a.red_facebook, a.red_instagram, a.red_linkedin, a.red_youtube].filter(Boolean),
    };

    const id = 'ess-datos-estructurados';
    let etiqueta = this.documento.getElementById(id);

    if (!etiqueta) {
      etiqueta = this.documento.createElement('script');
      etiqueta.id = id;
      etiqueta.setAttribute('type', 'application/ld+json');
      this.documento.head.appendChild(etiqueta);
    }

    etiqueta.textContent = JSON.stringify(esquema);
  }

  private definir(nombre: string, contenido: string): void {
    if (contenido) {
      this.meta.updateTag({ name: nombre, content: contenido });
    } else {
      this.meta.removeTag(`name="${nombre}"`);
    }
  }

  private definirPropiedad(propiedad: string, contenido: string): void {
    if (contenido) {
      this.meta.updateTag({ property: propiedad, content: contenido });
    } else {
      this.meta.removeTag(`property="${propiedad}"`);
    }
  }

  private urlAbsoluta(ruta?: string): string {
    const origen = this.documento.location?.origin ?? '';

    return ruta ? `${origen}${ruta.startsWith('/') ? '' : '/'}${ruta}` : this.documento.location?.href ?? '';
  }

  private canonica(url: string): void {
    if (!url) {
      return;
    }

    let enlace = this.documento.querySelector<HTMLLinkElement>('link[rel="canonical"]');

    if (!enlace) {
      enlace = this.documento.createElement('link');
      enlace.rel = 'canonical';
      this.documento.head.appendChild(enlace);
    }

    enlace.href = url;
  }
}
