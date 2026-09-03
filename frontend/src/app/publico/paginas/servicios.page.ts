import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { EncabezadoPaginaComponent } from '../../compartido/componentes/encabezado-pagina.component';
import { IconoComponent } from '../../compartido/componentes/icono.component';
import { SeoService } from '../../core/servicios/seo.service';
import { SitioService } from '../../core/servicios/sitio.service';

@Component({
  selector: 'app-servicios',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, IconoComponent, EncabezadoPaginaComponent],
  templateUrl: './servicios.page.html',
  styleUrl: './servicios.page.scss',
})
export class ServiciosPage implements OnInit {
  protected readonly sitio = inject(SitioService);
  private readonly seo = inject(SeoService);

  protected readonly categoriaActiva = signal<string>('todas');

  protected readonly categorias = computed(() => {
    const unicas = new Set(this.sitio.servicios().map((s) => s.categoria).filter(Boolean));

    return ['todas', ...Array.from(unicas).sort()];
  });

  protected readonly serviciosFiltrados = computed(() => {
    const categoria = this.categoriaActiva();
    const servicios = this.sitio.servicios();

    return categoria === 'todas' ? servicios : servicios.filter((s) => s.categoria === categoria);
  });

  ngOnInit(): void {
    this.seo.aplicar({
      titulo: 'Servicios',
      descripcion:
        'Vigilancia fija y movil, escoltas, gestion del riesgo, auditorias, inteligencia, investigacion y capacitacion en seguridad privada.',
      ruta: '/servicios',
    });
  }

  protected filtrar(categoria: string): void {
    this.categoriaActiva.set(categoria);
  }
}
