import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { IconoComponent } from '../../compartido/componentes/icono.component';
import { AjustesPanel, CampoAjuste, Medio } from '../../core/modelos/api.modelos';
import { erroresDeCampo, mensajeDeError } from '../../core/interceptores/errores';
import { ApiService } from '../../core/servicios/api.service';
import { AvisosService } from '../../core/servicios/avisos.service';
import { SitioService } from '../../core/servicios/sitio.service';
import { SelectorMedioComponent } from '../componentes/selector-medio.component';

const NOMBRES_GRUPO: Record<string, { titulo: string; descripcion: string; icono: string }> = {
  identidad: {
    titulo: 'Identidad',
    descripcion: 'Nombre, logo y datos legales de la empresa.',
    icono: 'shield',
  },
  apariencia: {
    titulo: 'Apariencia',
    descripcion: 'Colores, tipografia y forma de los bordes. Los cambios se aplican a todo el sitio.',
    icono: 'ajustes',
  },
  contacto: {
    titulo: 'Contacto',
    descripcion: 'Telefonos, correo, direccion y horario que se muestran en el sitio.',
    icono: 'telefono',
  },
  redes: { titulo: 'Redes sociales', descripcion: 'Enlaces del pie de pagina.', icono: 'flecha' },
  inicio: {
    titulo: 'Portada',
    descripcion: 'Textos y cifras de la pagina de inicio.',
    icono: 'panel',
  },
  seo: {
    titulo: 'SEO y analitica',
    descripcion: 'Como se ve el sitio en Google y en las redes sociales.',
    icono: 'search',
  },
};

@Component({
  selector: 'app-ajustes-admin',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, IconoComponent, SelectorMedioComponent],
  templateUrl: './ajustes-admin.page.html',
  styleUrl: './ajustes-admin.page.scss',
})
export class AjustesAdminPage {
  private readonly api = inject(ApiService);
  private readonly avisos = inject(AvisosService);
  private readonly sitio = inject(SitioService);

  protected readonly cargando = signal(true);
  protected readonly guardando = signal(false);
  protected readonly grupos = signal<Record<string, CampoAjuste[]>>({});
  protected readonly valores = signal<Record<string, string>>({});
  protected readonly erroresServidor = signal<Record<string, string>>({});
  protected readonly grupoActivo = signal('identidad');

  /** Medios ya guardados, para pintar la vista previa de los campos de imagen. */
  protected readonly mediosCargados = signal<Record<string, Medio | null>>({});

  protected readonly pestanas = computed(() =>
    Object.keys(this.grupos()).map((clave) => ({
      clave,
      ...(NOMBRES_GRUPO[clave] ?? { titulo: clave, descripcion: '', icono: 'ajustes' }),
    })),
  );

  protected readonly camposActivos = computed(() => this.grupos()[this.grupoActivo()] ?? []);

  protected readonly descripcionGrupo = computed(
    () => NOMBRES_GRUPO[this.grupoActivo()]?.descripcion ?? '',
  );

  constructor() {
    this.cargar();
  }

  private cargar(): void {
    this.cargando.set(true);

    this.api.get<AjustesPanel>('/admin/ajustes').subscribe({
      next: (datos) => {
        this.grupos.set(datos.grupos);
        this.valores.set(this.aTexto(datos.valores));
        this.cargando.set(false);
        this.cargarMedios();
      },
      error: (error) => {
        this.cargando.set(false);
        this.avisos.error(mensajeDeError(error));
      },
    });
  }

  /** Los valores viajan como texto en el formulario; el JSON se serializa. */
  private aTexto(valores: Record<string, unknown>): Record<string, string> {
    const texto: Record<string, string> = {};

    for (const [clave, valor] of Object.entries(valores)) {
      texto[clave] =
        valor !== null && typeof valor === 'object'
          ? JSON.stringify(valor, null, 2)
          : String(valor ?? '');
    }

    return texto;
  }

  /** Resuelve los ids de los campos `media` para mostrar su vista previa. */
  private cargarMedios(): void {
    const idsPorClave: Record<string, number> = {};

    for (const campos of Object.values(this.grupos())) {
      for (const campo of campos) {
        const id = Number(this.valores()[campo.clave]);
        if (campo.tipo === 'media' && id > 0) {
          idsPorClave[campo.clave] = id;
        }
      }
    }

    if (Object.keys(idsPorClave).length === 0) {
      return;
    }

    this.api.getPaginado<Medio>('/admin/media', { por_pagina: 100 }).subscribe({
      next: ({ datos }) => {
        const porId = new Map(datos.map((m) => [m.id, m]));
        const resultado: Record<string, Medio | null> = {};

        for (const [clave, id] of Object.entries(idsPorClave)) {
          resultado[clave] = porId.get(id) ?? null;
        }

        this.mediosCargados.set(resultado);
      },
      error: () => undefined,
    });
  }

  protected valorDe(clave: string): string {
    return this.valores()[clave] ?? '';
  }

  protected medioDe(clave: string): Medio | null {
    return this.mediosCargados()[clave] ?? null;
  }

  protected idMedioDe(clave: string): number | null {
    const id = Number(this.valores()[clave]);

    return id > 0 ? id : null;
  }

  protected escribir(clave: string, valor: string | number | null): void {
    this.valores.update((actuales) => ({ ...actuales, [clave]: valor === null ? '' : String(valor) }));
  }

  protected alEscribir(clave: string, evento: Event): void {
    this.escribir(clave, (evento.target as HTMLInputElement | HTMLTextAreaElement).value);
  }

  protected errorDe(clave: string): string {
    return this.erroresServidor()[clave] ?? '';
  }

  protected guardar(): void {
    this.guardando.set(true);
    this.erroresServidor.set({});

    // Solo se envian las claves del grupo visible para no pisar otros cambios.
    const ajustes: Record<string, string> = {};
    for (const campo of this.camposActivos()) {
      ajustes[campo.clave] = this.valorDe(campo.clave);
    }

    this.api.put<AjustesPanel>('/admin/ajustes', { ajustes }).subscribe({
      next: (datos) => {
        this.guardando.set(false);
        this.grupos.set(datos.grupos);
        this.valores.set(this.aTexto(datos.valores));
        this.avisos.exito('Ajustes guardados. El sitio ya muestra los cambios.');
        this.sitio.refrescar();
      },
      error: (error) => {
        this.guardando.set(false);
        this.erroresServidor.set(erroresDeCampo(error));
        this.avisos.error(mensajeDeError(error));
      },
    });
  }
}
