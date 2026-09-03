import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { IconoComponent } from '../../compartido/componentes/icono.component';
import { SeoService } from '../../core/servicios/seo.service';
import { SitioService } from '../../core/servicios/sitio.service';

@Component({
  selector: 'app-inicio',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, IconoComponent],
  templateUrl: './inicio.page.html',
  styleUrl: './inicio.page.scss',
})
export class InicioPage implements OnInit, OnDestroy {
  protected readonly sitio = inject(SitioService);
  private readonly seo = inject(SeoService);

  private temporizador?: ReturnType<typeof setInterval>;

  protected readonly indiceSlide = signal(0);

  protected readonly slideActual = computed(() => {
    const slides = this.sitio.slides();

    return slides.length ? slides[this.indiceSlide() % slides.length] : null;
  });

  /** Como maximo seis sectores en la portada; el resto vive en /sectores. */
  protected readonly sectoresPortada = computed(() => this.sitio.sectores().slice(0, 8));

  protected readonly serviciosPortada = computed(() => {
    const destacados = this.sitio.destacados();

    return destacados.length ? destacados : this.sitio.servicios().slice(0, 4);
  });

  ngOnInit(): void {
    this.seo.aplicar({ ruta: '/' });
    this.seo.organizacion();
    this.iniciarCarrusel();
  }

  ngOnDestroy(): void {
    this.detenerCarrusel();
  }

  protected irASlide(indice: number): void {
    this.indiceSlide.set(indice);
    this.iniciarCarrusel(); // Reinicia la cuenta tras una accion manual.
  }

  private iniciarCarrusel(): void {
    this.detenerCarrusel();

    if (this.sitio.slides().length < 2) {
      return;
    }

    this.temporizador = setInterval(() => {
      this.indiceSlide.update((i) => (i + 1) % this.sitio.slides().length);
    }, 7000);
  }

  private detenerCarrusel(): void {
    if (this.temporizador) {
      clearInterval(this.temporizador);
      this.temporizador = undefined;
    }
  }
}
