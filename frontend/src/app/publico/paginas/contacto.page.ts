import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

import { EncabezadoPaginaComponent } from '../../compartido/componentes/encabezado-pagina.component';
import { IconoComponent } from '../../compartido/componentes/icono.component';
import { ApiService } from '../../core/servicios/api.service';
import { SeoService } from '../../core/servicios/seo.service';
import { SitioService } from '../../core/servicios/sitio.service';
import { erroresDeCampo, mensajeDeError } from '../../core/interceptores/errores';

@Component({
  selector: 'app-contacto',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, IconoComponent, EncabezadoPaginaComponent],
  templateUrl: './contacto.page.html',
  styleUrl: './contacto.page.scss',
})
export class ContactoPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(ApiService);
  private readonly seo = inject(SeoService);
  private readonly ruta = inject(ActivatedRoute);
  protected readonly sitio = inject(SitioService);

  protected readonly enviando = signal(false);
  protected readonly enviado = signal(false);
  protected readonly errorGeneral = signal('');
  protected readonly erroresServidor = signal<Record<string, string>>({});

  protected readonly formulario = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(150)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(190)]],
    telefono: ['', [Validators.maxLength(40)]],
    empresa: ['', [Validators.maxLength(150)]],
    ciudad: ['', [Validators.maxLength(100)]],
    servicio_id: [''],
    mensaje: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(2000)]],
    // Trampa antispam: debe quedar siempre vacia.
    sitio_web: [''],
    acepta: [false, [Validators.requiredTrue]],
  });

  ngOnInit(): void {
    this.seo.aplicar({
      titulo: 'Contacto',
      descripcion:
        'Solicite una cotizacion de vigilancia y seguridad privada. Un asesor evalua su necesidad sin costo.',
      ruta: '/contacto',
    });

    // Permite llegar desde un servicio con ?servicio=ID preseleccionado.
    const servicio = this.ruta.snapshot.queryParamMap.get('servicio');
    if (servicio) {
      this.formulario.patchValue({ servicio_id: servicio });
    }
  }

  protected campoInvalido(nombre: string): boolean {
    const campo = this.formulario.get(nombre);

    return Boolean(campo && campo.invalid && (campo.dirty || campo.touched));
  }

  protected errorDe(nombre: string): string {
    return this.erroresServidor()[nombre] ?? '';
  }

  protected enviar(): void {
    this.errorGeneral.set('');
    this.erroresServidor.set({});

    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();

      return;
    }

    const { acepta, ...valores } = this.formulario.getRawValue();
    void acepta; // La aceptacion solo se valida en el navegador.

    this.enviando.set(true);

    this.api
      .post<{ id: number; mensaje: string }>('/publico/contacto', {
        ...valores,
        servicio_id: valores.servicio_id ? Number(valores.servicio_id) : null,
      })
      .subscribe({
        next: () => {
          this.enviando.set(false);
          this.enviado.set(true);
          this.formulario.reset();
        },
        error: (error) => {
          this.enviando.set(false);
          this.erroresServidor.set(erroresDeCampo(error));
          this.errorGeneral.set(mensajeDeError(error));
        },
      });
  }

  protected nuevoMensaje(): void {
    this.enviado.set(false);
  }
}
