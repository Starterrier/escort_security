import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { IconoComponent } from '../../compartido/componentes/icono.component';
import { RevelarDirective } from '../../compartido/directivas/revelar.directive';
import { SeoService } from '../../core/servicios/seo.service';
import { SitioService } from '../../core/servicios/sitio.service';

@Component({
  selector: 'app-inicio',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, IconoComponent, RevelarDirective],
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

  /**
   * El slide actual envuelto en una lista de un solo elemento.
   *
   * La plantilla lo recorre con `@for (... track s.id)` en lugar de
   * pintarlo con `@if`. La diferencia importa: `@if` reutiliza el mismo
   * DOM y se limita a cambiar los textos, asi que las animaciones de
   * entrada -- que solo corren cuando el nodo se crea -- no se repiten y
   * cada 7 segundos el titular cambiaba de golpe. Con `track s.id`,
   * Angular destruye y recrea el bloque en cada cambio y la portada
   * vuelve a entrar animada.
   */
  protected readonly slideVisible = computed(() => {
    const slide = this.slideActual();

    return slide ? [slide] : [];
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
