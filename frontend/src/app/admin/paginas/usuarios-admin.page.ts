import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { IconoComponent } from '../../compartido/componentes/icono.component';
import { Usuario } from '../../core/modelos/api.modelos';
import { erroresDeCampo, mensajeDeError } from '../../core/interceptores/errores';
import { ApiService } from '../../core/servicios/api.service';
import { AuthService } from '../../core/servicios/auth.service';
import { AvisosService } from '../../core/servicios/avisos.service';

@Component({
  selector: 'app-usuarios-admin',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, DatePipe, IconoComponent],
  templateUrl: './usuarios-admin.page.html',
  styleUrl: './usuarios-admin.page.scss',
})
export class UsuariosAdminPage {
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);
  private readonly avisos = inject(AvisosService);
  protected readonly auth = inject(AuthService);

  protected readonly usuarios = signal<Usuario[]>([]);
  protected readonly cargando = signal(true);
  protected readonly guardando = signal(false);
  protected readonly editando = signal<Usuario | null>(null);
  protected readonly abierto = signal(false);
  protected readonly erroresServidor = signal<Record<string, string>>({});
  protected readonly confirmando = signal<Usuario | null>(null);

  protected readonly formulario = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.maxLength(120)]],
    email: ['', [Validators.required, Validators.email]],
    clave: [''],
    rol: ['editor'],
    activo: [true],
  });

  constructor() {
    this.cargar();
  }

  protected cargar(): void {
    this.cargando.set(true);

    this.api.get<Usuario[]>('/admin/usuarios').subscribe({
      next: (datos) => {
        this.usuarios.set(datos);
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
    this.formulario.reset({ nombre: '', email: '', clave: '', rol: 'editor', activo: true });
    this.formulario.controls.clave.setValidators([Validators.required, Validators.minLength(8)]);
    this.formulario.controls.clave.updateValueAndValidity();
    this.abierto.set(true);
  }

  protected editar(usuario: Usuario): void {
    this.editando.set(usuario);
    this.erroresServidor.set({});
    // Al editar, la contrasena es opcional: solo se cambia si se escribe.
    this.formulario.controls.clave.setValidators([Validators.minLength(8)]);
    this.formulario.controls.clave.updateValueAndValidity();
    this.formulario.patchValue({
      nombre: usuario.nombre,
      email: usuario.email,
      clave: '',
      rol: usuario.rol,
      activo: Boolean(Number(usuario.activo)),
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

  protected invalido(campo: string): boolean {
    const control = this.formulario.get(campo);

    return Boolean(control && control.invalid && (control.dirty || control.touched));
  }

  protected guardar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();

      return;
    }

    this.guardando.set(true);
    this.erroresServidor.set({});

    const valores = this.formulario.getRawValue();
    const actual = this.editando();

    const cuerpo: Record<string, unknown> = {
      nombre: valores.nombre,
      email: valores.email,
      rol: valores.rol,
      activo: valores.activo ? 1 : 0,
    };

    if (valores.clave) {
      cuerpo['clave'] = valores.clave;
    }

    const peticion = actual
      ? this.api.put<Usuario>(`/admin/usuarios/${actual.id}`, cuerpo)
      : this.api.post<Usuario>('/admin/usuarios', cuerpo);

    peticion.subscribe({
      next: () => {
        this.guardando.set(false);
        this.avisos.exito(actual ? 'Usuario actualizado.' : 'Usuario creado.');
        this.cerrar();
        this.cargar();
      },
      error: (error) => {
        this.guardando.set(false);
        this.erroresServidor.set(erroresDeCampo(error));
        this.avisos.error(mensajeDeError(error));
      },
    });
  }

  protected eliminar(): void {
    const usuario = this.confirmando();

    if (!usuario) {
      return;
    }

    this.api.delete(`/admin/usuarios/${usuario.id}`).subscribe({
      next: () => {
        this.confirmando.set(null);
        this.avisos.exito('Usuario eliminado.');
        this.cargar();
      },
      error: (error) => {
        this.confirmando.set(null);
        this.avisos.error(mensajeDeError(error));
      },
    });
  }

  protected esYo(usuario: Usuario): boolean {
    return usuario.id === this.auth.usuario()?.id;
  }
}
