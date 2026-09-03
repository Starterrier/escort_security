import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { erroresDeCampo, mensajeDeError } from '../../core/interceptores/errores';
import { AuthService } from '../../core/servicios/auth.service';
import { AvisosService } from '../../core/servicios/avisos.service';

@Component({
  selector: 'app-cuenta',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  template: `
    <div class="encabezado-panel">
      <div>
        <h1>Mi cuenta</h1>
        <p>Datos de su usuario y cambio de contrasena.</p>
      </div>
    </div>

    <section class="tarjeta-panel" style="max-width: 620px">
      <h2 class="tarjeta-panel__titulo">Datos del usuario</h2>

      <dl class="datos-cuenta">
        <dt>Nombre</dt>
        <dd>{{ auth.usuario()?.nombre }}</dd>
        <dt>Correo</dt>
        <dd>{{ auth.usuario()?.email }}</dd>
        <dt>Perfil</dt>
        <dd>{{ auth.usuario()?.rol === 'admin' ? 'Administrador' : 'Editor' }}</dd>
      </dl>
    </section>

    <section class="tarjeta-panel" style="max-width: 620px">
      <h2 class="tarjeta-panel__titulo">Cambiar contrasena</h2>

      <form [formGroup]="formulario" (ngSubmit)="cambiar()" novalidate>
        <div class="rejilla-campos">
          <div class="campo-panel campo-panel--ancho">
            <label for="actual">Contrasena actual *</label>
            <input id="actual" type="password" formControlName="clave_actual" autocomplete="current-password" />
            @if (errorDe('clave_actual')) {
              <small class="error-campo">{{ errorDe('clave_actual') }}</small>
            }
          </div>

          <div class="campo-panel">
            <label for="nueva">Nueva contrasena *</label>
            <input id="nueva" type="password" formControlName="clave_nueva" autocomplete="new-password" />
            <small>Minimo 8 caracteres.</small>
            @if (invalido('clave_nueva')) {
              <small class="error-campo">Debe tener al menos 8 caracteres.</small>
            }
          </div>

          <div class="campo-panel">
            <label for="repetir">Repetir contrasena *</label>
            <input id="repetir" type="password" formControlName="repetir" autocomplete="new-password" />
            @if (noCoinciden()) {
              <small class="error-campo">Las contrasenas no coinciden.</small>
            }
          </div>
        </div>

        <div style="margin-top: 22px">
          <button type="submit" class="btn btn--primario" [disabled]="guardando()">
            {{ guardando() ? 'Guardando...' : 'Cambiar contrasena' }}
          </button>
        </div>
      </form>
    </section>
  `,
  styles: `
    .datos-cuenta {
      display: grid;
      grid-template-columns: 110px 1fr;
      gap: 8px 16px;
      margin: 0;
      font-size: 0.92rem;

      dt {
        font-weight: 700;
        color: var(--texto-tenue);
      }

      dd {
        margin: 0;
      }
    }
  `,
})
export class CuentaPage {
  private readonly fb = inject(FormBuilder);
  private readonly avisos = inject(AvisosService);
  protected readonly auth = inject(AuthService);

  protected readonly guardando = signal(false);
  protected readonly erroresServidor = signal<Record<string, string>>({});

  protected readonly formulario = this.fb.nonNullable.group({
    clave_actual: ['', [Validators.required]],
    clave_nueva: ['', [Validators.required, Validators.minLength(8)]],
    repetir: ['', [Validators.required]],
  });

  protected noCoinciden(): boolean {
    const { clave_nueva, repetir } = this.formulario.getRawValue();

    return repetir !== '' && clave_nueva !== repetir;
  }

  protected invalido(campo: string): boolean {
    const control = this.formulario.get(campo);

    return Boolean(control && control.invalid && (control.dirty || control.touched));
  }

  protected errorDe(campo: string): string {
    return this.erroresServidor()[campo] ?? '';
  }

  protected cambiar(): void {
    if (this.formulario.invalid || this.noCoinciden()) {
      this.formulario.markAllAsTouched();

      return;
    }

    this.guardando.set(true);
    this.erroresServidor.set({});

    const { clave_actual, clave_nueva } = this.formulario.getRawValue();

    this.auth.cambiarClave(clave_actual, clave_nueva).subscribe({
      next: () => {
        this.guardando.set(false);
        this.formulario.reset();
        this.avisos.exito('Contrasena actualizada. Su sesion sigue activa.');
      },
      error: (error) => {
        this.guardando.set(false);
        this.erroresServidor.set(erroresDeCampo(error));
        this.avisos.error(mensajeDeError(error));
      },
    });
  }
}
