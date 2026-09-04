import {
  DestroyRef,
  Directive,
  ElementRef,
  OnInit,
  inject,
  input,
  numberAttribute,
} from '@angular/core';

/**
 * Revela el elemento cuando entra en pantalla.
 *
 *   <div revelar>...</div>
 *   <div revelar="izquierda" [revelarRetraso]="120">...</div>
 *
 * El estilo vive en `estilos/_movimiento.scss`; aqui solo se decide
 * CUANDO cambia de estado. La clase `.revelar` se pone desde el propio
 * TypeScript, no en la plantilla: si estuviera escrita a mano en el HTML
 * y esta directiva fallara al cargar, el bloque se quedaria invisible
 * para siempre. Poniendola aqui, el elemento solo se oculta si hay
 * alguien capaz de volver a mostrarlo.
 *
 * No toca el estado del componente, asi que convive con OnPush sin
 * disparar ciclos de deteccion de cambios.
 */
@Directive({
  selector: '[revelar]',
})
export class RevelarDirective implements OnInit {
  /** Direccion de entrada: '' (desde abajo), izquierda, derecha o escala. */
  readonly revelar = input<'' | 'izquierda' | 'derecha' | 'escala'>('');

  /** Retraso en milisegundos, para escalonar varios elementos a mano. */
  readonly revelarRetraso = input(0, { transform: numberAttribute });

  /**
   * Parte del elemento que debe verse para disparar la animacion.
   * Un bloque muy alto nunca llega a estar visible al 25 %, asi que el
   * valor se queda bajo a proposito.
   */
  readonly revelarUmbral = input(0.12, { transform: numberAttribute });

  private readonly elemento = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    const nodo = this.elemento.nativeElement;

    // Sin IntersectionObserver (navegador antiguo, o un render fuera del
    // navegador) el elemento se queda como esta: visible y sin animar.
    if (typeof IntersectionObserver === 'undefined') {
      return;
    }

    // Quien pidio menos movimiento no necesita observador ninguno. El CSS
    // ya neutraliza la animacion, pero asi tampoco se gasta un observer.
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    nodo.classList.add('revelar');

    const variante = this.revelar();
    if (variante) {
      nodo.classList.add(`revelar--${variante}`);
    }

    const retraso = this.revelarRetraso();
    if (retraso > 0) {
      nodo.style.setProperty('--revelar-retraso', `${retraso}ms`);
    }

    const observador = new IntersectionObserver(
      (entradas) => {
        for (const entrada of entradas) {
          if (!entrada.isIntersecting) {
            continue;
          }

          entrada.target.classList.add('revelar--visible');
          // Una sola vez: si se volviera a ocultar al subir el scroll, el
          // contenido parpadearia cada vez que se pasa por encima.
          observador.unobserve(entrada.target);
        }
      },
      {
        threshold: this.revelarUmbral(),
        // Adelanta el disparo: a media pantalla de distancia la animacion
        // ya ha terminado cuando el bloque llega al centro de la vista.
        rootMargin: '0px 0px -10% 0px',
      },
    );

    observador.observe(nodo);
    this.destroyRef.onDestroy(() => observador.disconnect());
  }
}
