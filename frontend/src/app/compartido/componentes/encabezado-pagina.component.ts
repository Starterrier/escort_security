import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Franja de titulo con miga de pan que abre las paginas interiores.
 */
@Component({
  selector: 'app-encabezado-pagina',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <section class="franja-titulo">
      @if (imagen()) {
        <img class="franja-titulo__fondo" [src]="imagen()" alt="" aria-hidden="true" />
      }
      <div class="franja-titulo__velo"></div>

      <div class="contenedor franja-titulo__interior">
        <nav class="miga" aria-label="Ruta de navegacion">
          <a routerLink="/">Inicio</a>
          @if (padre(); as p) {
            <span aria-hidden="true">/</span>
            <a [routerLink]="p.ruta">{{ p.etiqueta }}</a>
          }
          <span aria-hidden="true">/</span>
          <span class="miga__actual">{{ titulo() }}</span>
        </nav>

        <h1>{{ titulo() }}</h1>

        @if (subtitulo()) {
          <p class="franja-titulo__subtitulo">{{ subtitulo() }}</p>
        }
      </div>
    </section>
  `,
  styles: `
    .franja-titulo {
      position: relative;
      overflow: hidden;
      background: var(--color-primario);
      color: #fff;

      &__fondo {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      &__velo {
        position: absolute;
        inset: 0;
        background: linear-gradient(
          100deg,
          rgba(var(--primario-rgb), 0.96) 0%,
          rgba(var(--primario-rgb), 0.8) 60%,
          rgba(var(--primario-rgb), 0.55) 100%
        );
      }

      &__interior {
        position: relative;
        padding-block: clamp(48px, 7vw, 88px);
      }

      &__subtitulo {
        max-width: 62ch;
        margin: 0;
        font-size: 1.06rem;
        color: rgba(255, 255, 255, 0.82);
      }

      h1 {
        max-width: 20ch;
        margin-bottom: 12px;
        color: #fff;
        text-wrap: balance;
      }
    }

    .miga {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 8px;
      margin-bottom: 18px;
      font-size: 0.82rem;
      color: rgba(255, 255, 255, 0.55);

      a {
        color: rgba(255, 255, 255, 0.78);

        &:hover {
          color: #fff;
        }
      }

      &__actual {
        color: var(--color-acento);
        font-weight: 600;
      }
    }
  `,
})
export class EncabezadoPaginaComponent {
  readonly titulo = input.required<string>();
  readonly subtitulo = input('');
  readonly imagen = input('');
  readonly padre = input<{ etiqueta: string; ruta: string } | null>(null);
}
