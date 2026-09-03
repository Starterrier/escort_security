<?php

declare(strict_types=1);

namespace Ess\Controllers;

/**
 * Paginas de contenido editables (Nosotros, Esencia, RSE, politicas...).
 */
final class PaginaController extends CrudController
{
    protected function tabla(): string
    {
        return 'paginas';
    }

    protected function campoTitulo(): string
    {
        return 'titulo';
    }

    protected function camposBusqueda(): array
    {
        return ['titulo', 'subtitulo', 'slug'];
    }

    protected function ordenPorDefecto(): string
    {
        return 'orden ASC, titulo ASC';
    }

    protected function reglas(): array
    {
        return [
            'titulo'           => ['requerido|texto|max:180', null],
            'slug'             => ['texto|slug|max:160', ''],
            'subtitulo'        => ['texto|max:255', ''],
            'contenido'        => ['html', ''],
            'imagen_id'        => ['entero', null],
            'meta_titulo'      => ['texto|max:180', ''],
            'meta_descripcion' => ['texto|max:300', ''],
            'en_menu'          => ['booleano', 0],
            'orden'            => ['entero', 0],
            'activo'           => ['booleano', 1],
        ];
    }
}
