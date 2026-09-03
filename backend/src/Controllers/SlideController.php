<?php

declare(strict_types=1);

namespace Ess\Controllers;

/**
 * Diapositivas del carrusel de portada.
 */
final class SlideController extends CrudController
{
    protected function tabla(): string
    {
        return 'slides';
    }

    protected function campoTitulo(): string
    {
        return 'titulo';
    }

    protected function campoSlug(): ?string
    {
        return null; // El carrusel no necesita URL propia.
    }

    protected function camposBusqueda(): array
    {
        return ['titulo', 'subtitulo'];
    }

    protected function reglas(): array
    {
        return [
            'titulo'    => ['requerido|texto|max:180', null],
            'subtitulo' => ['texto|max:255', ''],
            'texto'     => ['texto|max:600', ''],
            'cta_texto' => ['texto|max:80', ''],
            'cta_url'   => ['texto|url|max:255', ''],
            'imagen_id' => ['entero', null],
            'orden'     => ['entero', 0],
            'activo'    => ['booleano', 1],
        ];
    }
}
