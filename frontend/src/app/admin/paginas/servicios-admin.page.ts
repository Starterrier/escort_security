import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';

import { IconoComponent, ICONOS_DISPONIBLES } from '../../compartido/componentes/icono.component';
import { Servicio } from '../../core/modelos/api.modelos';
import { erroresDeCampo, mensajeDeError } from '../../core/interceptores/errores';
import { ApiService } from '../../core/servicios/api.service';
import { AvisosService } from '../../core/servicios/avisos.service';
import { SitioService } from '../../core/servicios/sitio.service';
import { SelectorMedioComponent } from '../componentes/selector-medio.component';

@Component({
  selector: 'app-servicios-admin',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, IconoComponent, SelectorMedioComponent],
  templateUrl: './servicios-admin.page.html',
  styleUrl: './servicios-admin.page.scss',
})
export class ServiciosAdminPage {
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);
  private readonly avisos = inject(AvisosService);
  private readonly sitio = inject(SitioService);

  protected readonly iconos = ICONOS_DISPONIBLES;

  protected readonly servicios = signal<Servicio[]>([]);
  protected readonly cargando = signal(true);
  protected readonly guardando = signal(false);
  protected readonly editando = signal<Servicio | null>(null);
  protected readonly formularioAbierto = signal(false);
  protected readonly erroresServidor = signal<Record<string, string>>({});
  protected readonly filtro = signal('');
  protected readonly confirmandoBorrado = signal<Servicio | null>(null);

  protected readonly imagenId = signal<number | null>(null);
  protected readonly imagenActual = computed(() => this.editando()?.imagen ?? null);

  /** Vinetas del servicio; se editan como lista de controles sueltos. */
  protected readonly items = signal<FormControl<string>[]>([]);

  protected readonly formulario = this.fb.nonNullable.group({
    titulo: ['', [Validators.required, Validators.maxLength(180)]],
    slug: [''],
    categoria: ['general', [Validators.maxLength(80)]],
    resumen: ['', [Validators.maxLength(400)]],
    descripcion: [''],
    icono: ['shield'],
    destacado: [false],
    activo: [true],
    orden: [0],
    meta_titulo: ['', [Validators.maxLength(180)]],
    meta_descripcion: ['', [Validators.maxLength(300)]],
  });

  protected readonly filtrados = computed(() => {
    const texto = this.filtro().trim().toLowerCase();
    const lista = this.servicios();

    if (!texto) {
      return lista;
    }

    return lista.filter(
      (s) =>
        s.titulo.toLowerCase().includes(texto) ||
        s.categoria.toLowerCase().includes(texto) ||
        s.resumen.toLowerCase().includes(texto),
    );
  });

  constructor() {
    this.cargar();
  }

  // --- Carga -------------------------------------------------------------

  protected cargar(): void {
    this.cargando.set(true);

    this.api.get<Servicio[]>('/admin/servicios').subscribe({
      next: (datos) => {
        this.servicios.set(datos);
        this.cargando.set(false);
      },
      error: (error) => {
        this.cargando.set(false);
        this.avisos.error(mensajeDeError(error));
      },
    });
  }

  protected actualizarFiltro(evento: Event): void {
    this.filtro.set((evento.target as HTMLInputElement).value);
  }

  // --- Formulario ---------------------------------------------------------

  protected nuevo(): void {
    this.editando.set(null);
    this.erroresServidor.set({});
    this.imagenId.set(null);
    this.items.set([]);
    this.formulario.reset({
      titulo: '',
      slug: '',
      categoria: 'general',
      resumen: '',
      descripcion: '',
      icono: 'shield',
      destacado: false,
      activo: true,
      orden: this.servicios().length,
      meta_titulo: '',
      meta_descripcion: '',
    });
    this.formularioAbierto.set(true);
  }

  protected editar(servicio: Servicio): void {
    this.erroresServidor.set({});

    // El listado no trae la descripcion completa: se pide el registro entero.
    this.api.get<Servicio>(`/admin/servicios/${servicio.id}`).subscribe({
      next: (completo) => {
        this.editando.set(completo);
        this.imagenId.set(completo.imagen_id);
        this.items.set(
          (completo.items ?? []).map((texto) => this.fb.nonNullable.control(texto)),
        );
        this.formulario.patchValue({
          titulo: completo.titulo,
          slug: completo.slug,
          categoria: completo.categoria,
          resumen: completo.resumen,
          descripcion: completo.descripcion ?? '',
          icono: completo.icono,
          destacado: Boolean(Number(completo.destacado)),
          activo: Boolean(Number(completo.activo)),
          orden: completo.orden,
          meta_titulo: completo.meta_titulo ?? '',
          meta_descripcion: completo.meta_descripcion ?? '',
        });
        this.formularioAbierto.set(true);
      },
      error: (error) => this.avisos.error(mensajeDeError(error)),
    });
  }

  protected cerrarFormulario(): void {
    this.formularioAbierto.set(false);
    this.editando.set(null);
  }

  protected agregarItem(): void {
    this.items.update((lista) => [...lista, this.fb.nonNullable.control('')]);
  }

  protected quitarItem(indice: number): void {
    this.items.update((lista) => lista.filter((_, i) => i !== indice));
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
      destacado: valores.destacado ? 1 : 0,
      activo: valores.activo ? 1 : 0,
      imagen_id: this.imagenId(),
      items: this.items()
        .map((control) => control.value.trim())
        .filter((texto) => texto !== ''),
    };

    const actual = this.editando();
    const peticion = actual
      ? this.api.put<Servicio>(`/admin/servicios/${actual.id}`, cuerpo)
      : this.api.post<Servicio>('/admin/servicios', cuerpo);

    peticion.subscribe({
      next: () => {
        this.guardando.set(false);
        this.avisos.exito(actual ? 'Servicio actualizado.' : 'Servicio creado.');
        this.cerrarFormulario();
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

  // --- Acciones de la tabla ------------------------------------------------

  protected alternarActivo(servicio: Servicio): void {
    const activo = Number(servicio.activo) === 1 ? 0 : 1;

    this.api.put<Servicio>(`/admin/servicios/${servicio.id}`, { activo }).subscribe({
      next: () => {
        this.avisos.exito(activo ? 'Servicio publicado.' : 'Servicio ocultado.');
        this.cargar();
        this.sitio.refrescar();
      },
      error: (error) => this.avisos.error(mensajeDeError(error)),
    });
  }

  protected mover(servicio: Servicio, direccion: -1 | 1): void {
    const lista = [...this.servicios()];
    const desde = lista.findIndex((s) => s.id === servicio.id);
    const hasta = desde + direccion;

    if (desde < 0 || hasta < 0 || hasta >= lista.length) {
      return;
    }

    [lista[desde], lista[hasta]] = [lista[hasta], lista[desde]];
    this.servicios.set(lista);

    this.api.post('/admin/servicios/reordenar', { orden: lista.map((s) => s.id) }).subscribe({
      next: () => this.sitio.refrescar(),
      error: (error) => {
        this.avisos.error(mensajeDeError(error));
        this.cargar();
      },
    });
  }

  protected confirmarBorrado(servicio: Servicio): void {
    this.confirmandoBorrado.set(servicio);
  }

  protected cancelarBorrado(): void {
    this.confirmandoBorrado.set(null);
  }

  protected eliminar(): void {
    const servicio = this.confirmandoBorrado();

    if (!servicio) {
      return;
    }

    this.api.delete(`/admin/servicios/${servicio.id}`).subscribe({
      next: () => {
        this.confirmandoBorrado.set(null);
        this.avisos.exito('Servicio eliminado.');
        this.cargar();
        this.sitio.refrescar();
      },
      error: (error) => {
        this.confirmandoBorrado.set(null);
        this.avisos.error(mensajeDeError(error));
      },
    });
  }
}
