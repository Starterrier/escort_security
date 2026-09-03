import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { IconoComponent } from '../../compartido/componentes/icono.component';
import { mensajeDeError } from '../../core/interceptores/errores';
import { AuthService } from '../../core/servicios/auth.service';

@Component({
  selector: 'app-entrar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, IconoComponent],
  templateUrl: './entrar.page.html',
  styleUrl: './entrar.page.scss',
})
export class EntrarPage {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly ruta = inject(ActivatedRoute);

  protected readonly enviando = signal(false);
  protected readonly error = signal('');
  protected readonly verClave = signal(false);

  protected readonly formulario = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    clave: ['', [Validators.required, Validators.minLength(6)]],
  });

  protected entrar(): void {
    this.error.set('');

    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();

      return;
    }

    const { email, clave } = this.formulario.getRawValue();

    this.enviando.set(true);

    this.auth.entrar(email, clave).subscribe({
      next: () => {
        const regresar = this.ruta.snapshot.queryParamMap.get('regresar');
        void this.router.navigateByUrl(regresar && regresar.startsWith('/admin') ? regresar : '/admin');
      },
      error: (error) => {
        this.enviando.set(false);
        this.error.set(mensajeDeError(error));
      },
    });
  }

  protected alternarClave(): void {
    this.verClave.update((v) => !v);
  }

  protected invalido(campo: string): boolean {
    const control = this.formulario.get(campo);

    return Boolean(control && control.invalid && (control.dirty || control.touched));
  }
}
