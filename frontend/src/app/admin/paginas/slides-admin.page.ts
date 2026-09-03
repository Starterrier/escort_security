import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { IconoComponent } from '../../compartido/componentes/icono.component';
import { Slide } from '../../core/modelos/api.modelos';
import { erroresDeCampo, mensajeDeError } from '../../core/interceptores/errores';
import { ApiService } from '../../core/servicios/api.service';
import { AvisosService } from '../../core/servicios/avisos.service';
import { SitioService } from '../../core/servicios/sitio.service';
import { SelectorMedioComponent } from '../componentes/selector-medio.component';

@Component({
  selector: 'app-slides-admin',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, IconoComponent, SelectorMedioComponent],
  templateUrl: './slides-admin.page.html',
  styleUrl: './slides-admin.page.scss',
})
export class SlidesAdminPage {
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);
  private readonly avisos = inject(AvisosService);
  private readonly sitio = inject(SitioService);

  protected readonly slides = signal<Slide[]>([]);
  protected readonly cargando = signal(true);
  protected readonly guardando = signal(false);
  protected readonly editando = signal<Slide | null>(null);
  protected readonly abierto = signal(false);
  protected readonly erroresServidor = signal<Record<string, string>>({});
  protected readonly confirmando = signal<Slide | null>(null);

  protected readonly imagenId = signal<number | null>(null);
  protected readonly imagenActual = computed(() => this.editando()?.imagen ?? null);

  protected readonly formulario = this.fb.nonNullable.group({
    titulo: ['', [Validators.required, Validators.maxLength(180)]],
    subtitulo: ['', [Validators.maxLength(255)]],
    texto: ['', [Validators.maxLength(600)]],
    cta_texto: ['', [Validators.maxLength(80)]],
    cta_url: ['', [Validators.maxLength(255)]],
    activo: [true],
  });

  constructor() {
    this.cargar();
  }

  protected cargar(): void {
    this.cargando.set(true);

    this.api.get<Slide[]>('/admin/slides').subscribe({
      next: (datos) => {
        this.slides.set(datos);
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
      subtitulo: '',
      texto: '',
      cta_texto: 'Solicitar asesoria',
      cta_url: '/contacto',
      activo: true,
    });
    this.abierto.set(true);
  }

  protected editar(slide: Slide): void {
    this.editando.set(slide);
    this.erroresServidor.set({});
    this.imagenId.set(slide.imagen_id);
    this.formulario.patchValue({
      titulo: slide.titulo,
      subtitulo: slide.subtitulo,
      texto: slide.texto ?? '',
      cta_texto: slide.cta_texto,
      cta_url: slide.cta_url,
      activo: Boolean(Number(slide.activo)),
    });
    this.abierto.set(true);
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
    const cuerpo = { ...valores, activo: valores.activo ? 1 : 0, imagen_id: this.imagenId() };

    const actual = this.editando();
    const peticion = actual
      ? this.api.put<Slide>(`/admin/slides/${actual.id}`, cuerpo)
      : this.api.post<Slide>('/admin/slides', cuerpo);

    peticion.subscribe({
      next: () => {
        this.guardando.set(false);
        this.avisos.exito(actual ? 'Diapositiva actualizada.' : 'Diapositiva creada.');
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

  protected mover(slide: Slide, direccion: -1 | 1): void {
    const lista = [...this.slides()];
    const desde = lista.findIndex((s) => s.id === slide.id);
    const hasta = desde + direccion;

    if (desde < 0 || hasta < 0 || hasta >= lista.length) {
      return;
    }

    [lista[desde], lista[hasta]] = [lista[hasta], lista[desde]];
    this.slides.set(lista);

    this.api.post('/admin/slides/reordenar', { orden: lista.map((s) => s.id) }).subscribe({
      next: () => this.sitio.refrescar(),
      error: (error) => {
        this.avisos.error(mensajeDeError(error));
        this.cargar();
      },
    });
  }

  protected alternarActivo(slide: Slide): void {
    const activo = Number(slide.activo) === 1 ? 0 : 1;

    this.api.put(`/admin/slides/${slide.id}`, { activo }).subscribe({
      next: () => {
        this.cargar();
        this.sitio.refrescar();
      },
      error: (error) => this.avisos.error(mensajeDeError(error)),
    });
  }

  protected eliminar(): void {
    const slide = this.confirmando();

    if (!slide) {
      return;
    }

    this.api.delete(`/admin/slides/${slide.id}`).subscribe({
      next: () => {
        this.confirmando.set(null);
        this.avisos.exito('Diapositiva eliminada.');
        this.cargar();
        this.sitio.refrescar();
      },
      error: (error) => {
        this.confirmando.set(null);
        this.avisos.error(mensajeDeError(error));
      },
    });
  }
}
