import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { IconoComponent } from '../../compartido/componentes/icono.component';
import { Pagina } from '../../core/modelos/api.modelos';
import { erroresDeCampo, mensajeDeError } from '../../core/interceptores/errores';
import { ApiService } from '../../core/servicios/api.service';
import { AvisosService } from '../../core/servicios/avisos.service';
import { SitioService } from '../../core/servicios/sitio.service';
import { SelectorMedioComponent } from '../componentes/selector-medio.component';

@Component({
  selector: 'app-paginas-admin',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, IconoComponent, SelectorMedioComponent],
  templateUrl: './paginas-admin.page.html',
  styleUrl: './paginas-admin.page.scss',
})
export class PaginasAdminPage {
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);
  private readonly avisos = inject(AvisosService);
  private readonly sitio = inject(SitioService);

  protected readonly paginas = signal<Pagina[]>([]);
  protected readonly cargando = signal(true);
  protected readonly guardando = signal(false);
  protected readonly editando = signal<Pagina | null>(null);
  protected readonly abierto = signal(false);
  protected readonly erroresServidor = signal<Record<string, string>>({});
  protected readonly confirmando = signal<Pagina | null>(null);

  protected readonly imagenId = signal<number | null>(null);
  protected readonly imagenActual = computed(() => this.editando()?.imagen ?? null);

  protected readonly formulario = this.fb.nonNullable.group({
    titulo: ['', [Validators.required, Validators.maxLength(180)]],
    slug: [''],
    subtitulo: ['', [Validators.maxLength(255)]],
    contenido: [''],
    meta_titulo: ['', [Validators.maxLength(180)]],
    meta_descripcion: ['', [Validators.maxLength(300)]],
    en_menu: [false],
    orden: [0],
    activo: [true],
  });

  constructor() {
    this.cargar();
  }

  protected cargar(): void {
    this.cargando.set(true);

    this.api.get<Pagina[]>('/admin/paginas').subscribe({
      next: (datos) => {
        this.paginas.set(datos);
        this.cargando.set(false);
      },
      error: (error) => {
        this.cargando.set(false);
        this.avisos.error(mensajeDeError(error));
      },
    });
  }

  protected nuevo(): void {
    this.editando.set(null);
    this.erroresServidor.set({});
    this.imagenId.set(null);
    this.formulario.reset({
      titulo: '',
      slug: '',
      subtitulo: '',
      contenido: '',
      meta_titulo: '',
      meta_descripcion: '',
      en_menu: false,
      orden: this.paginas().length,
      activo: true,
    });
    this.abierto.set(true);
  }

  protected editar(pagina: Pagina): void {
    this.erroresServidor.set({});

    this.api.get<Pagina>(`/admin/paginas/${pagina.id}`).subscribe({
      next: (completa) => {
        this.editando.set(completa);
        this.imagenId.set(completa.imagen_id);
        this.formulario.patchValue({
          titulo: completa.titulo,
          slug: completa.slug,
          subtitulo: completa.subtitulo,
          contenido: completa.contenido ?? '',
          meta_titulo: completa.meta_titulo,
          meta_descripcion: completa.meta_descripcion,
          en_menu: Boolean(Number(completa.en_menu)),
          orden: completa.orden ?? 0,
          activo: Boolean(Number(completa.activo)),
        });
        this.abierto.set(true);
      },
      error: (error) => this.avisos.error(mensajeDeError(error)),
    });
  }

  protected cerrar(): void {
    this.abierto.set(false);
    this.editando.set(null);
  }

  protected errorDe(campo: string): string {
    return this.erroresServidor()[campo] ?? '';
  }

  protected guardar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();

      return;
    }

    this.guardando.set(true);
    this.erroresServidor.set({});

    const valores = this.formulario.getRawValue();
    const cuerpo = {
      ...valores,
      activo: valores.activo ? 1 : 0,
      en_menu: valores.en_menu ? 1 : 0,
      imagen_id: this.imagenId(),
    };

    const actual = this.editando();
    const peticion = actual
      ? this.api.put<Pagina>(`/admin/paginas/${actual.id}`, cuerpo)
      : this.api.post<Pagina>('/admin/paginas', cuerpo);

    peticion.subscribe({
      next: () => {
        this.guardando.set(false);
        this.avisos.exito(actual ? 'Pagina actualizada.' : 'Pagina creada.');
        this.cerrar();
        this.cargar();
        this.sitio.refrescar();
      },
      error: (error) => {
        this.guardando.set(false);
        this.erroresServidor.set(erroresDeCampo(error));
        this.avisos.error(mensajeDeError(error));
      },
    });
  }

  protected alternarActivo(pagina: Pagina): void {
    const activo = Number(pagina.activo) === 1 ? 0 : 1;

    this.api.put(`/admin/paginas/${pagina.id}`, { activo }).subscribe({
      next: () => {
        this.cargar();
        this.sitio.refrescar();
      },
      error: (error) => this.avisos.error(mensajeDeError(error)),
    });
  }

  protected eliminar(): void {
    const pagina = this.confirmando();

    if (!pagina) {
      return;
    }

    this.api.delete(`/admin/paginas/${pagina.id}`).subscribe({
      next: () => {
        this.confirmando.set(null);
        this.avisos.exito('Pagina eliminada.');
        this.cargar();
        this.sitio.refrescar();
      },
      error: (error) => {
        this.confirmando.set(null);
        this.avisos.error(mensajeDeError(error));
      },
    });
  }

  protected urlPublica(pagina: Pagina): string {
    return pagina.slug === 'nosotros' ? '/nosotros' : `/pagina/${pagina.slug}`;
  }
}
