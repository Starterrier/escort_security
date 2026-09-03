import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { ICONOS_DISPONIBLES, IconoComponent } from '../../compartido/componentes/icono.component';
import { Sector } from '../../core/modelos/api.modelos';
import { erroresDeCampo, mensajeDeError } from '../../core/interceptores/errores';
import { ApiService } from '../../core/servicios/api.service';
import { AvisosService } from '../../core/servicios/avisos.service';
import { SitioService } from '../../core/servicios/sitio.service';
import { SelectorMedioComponent } from '../componentes/selector-medio.component';

@Component({
  selector: 'app-sectores-admin',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, IconoComponent, SelectorMedioComponent],
  templateUrl: './sectores-admin.page.html',
  styleUrl: './sectores-admin.page.scss',
})
export class SectoresAdminPage {
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);
  private readonly avisos = inject(AvisosService);
  private readonly sitio = inject(SitioService);

  protected readonly iconos = ICONOS_DISPONIBLES;

  protected readonly sectores = signal<Sector[]>([]);
  protected readonly cargando = signal(true);
  protected readonly guardando = signal(false);
  protected readonly editando = signal<Sector | null>(null);
  protected readonly abierto = signal(false);
  protected readonly erroresServidor = signal<Record<string, string>>({});
  protected readonly confirmando = signal<Sector | null>(null);

  protected readonly imagenId = signal<number | null>(null);
  protected readonly imagenActual = computed(() => this.editando()?.imagen ?? null);

  protected readonly formulario = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.maxLength(120)]],
    slug: [''],
    descripcion: ['', [Validators.maxLength(400)]],
    icono: ['building'],
    activo: [true],
  });

  constructor() {
    this.cargar();
  }

  protected cargar(): void {
    this.cargando.set(true);

    this.api.get<Sector[]>('/admin/sectores').subscribe({
      next: (datos) => {
        this.sectores.set(datos);
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
    this.formulario.reset({ nombre: '', slug: '', descripcion: '', icono: 'building', activo: true });
    this.abierto.set(true);
  }

  protected editar(sector: Sector): void {
    this.editando.set(sector);
    this.erroresServidor.set({});
    this.imagenId.set(sector.imagen_id);
    this.formulario.patchValue({
      nombre: sector.nombre,
      slug: sector.slug,
      descripcion: sector.descripcion,
      icono: sector.icono,
      activo: Boolean(Number(sector.activo)),
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
    const cuerpo = {
      ...valores,
      activo: valores.activo ? 1 : 0,
      imagen_id: this.imagenId(),
    };

    const actual = this.editando();
    const peticion = actual
      ? this.api.put<Sector>(`/admin/sectores/${actual.id}`, cuerpo)
      : this.api.post<Sector>('/admin/sectores', cuerpo);

    peticion.subscribe({
      next: () => {
        this.guardando.set(false);
        this.avisos.exito(actual ? 'Sector actualizado.' : 'Sector creado.');
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

  protected mover(sector: Sector, direccion: -1 | 1): void {
    const lista = [...this.sectores()];
    const desde = lista.findIndex((s) => s.id === sector.id);
    const hasta = desde + direccion;

    if (desde < 0 || hasta < 0 || hasta >= lista.length) {
      return;
    }

    [lista[desde], lista[hasta]] = [lista[hasta], lista[desde]];
    this.sectores.set(lista);

    this.api.post('/admin/sectores/reordenar', { orden: lista.map((s) => s.id) }).subscribe({
      next: () => this.sitio.refrescar(),
      error: (error) => {
        this.avisos.error(mensajeDeError(error));
        this.cargar();
      },
    });
  }

  protected alternarActivo(sector: Sector): void {
    const activo = Number(sector.activo) === 1 ? 0 : 1;

    this.api.put(`/admin/sectores/${sector.id}`, { activo }).subscribe({
      next: () => {
        this.cargar();
        this.sitio.refrescar();
      },
      error: (error) => this.avisos.error(mensajeDeError(error)),
    });
  }

  protected confirmar(sector: Sector): void {
    this.confirmando.set(sector);
  }

  protected eliminar(): void {
    const sector = this.confirmando();

    if (!sector) {
      return;
    }

    this.api.delete(`/admin/sectores/${sector.id}`).subscribe({
      next: () => {
        this.confirmando.set(null);
        this.avisos.exito('Sector eliminado.');
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
