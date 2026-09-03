<?php

declare(strict_types=1);

namespace Ess\Controllers;

/**
 * Sectores atendidos (residencial, bancario, portuario, mineria...).
 */
final class SectorController extends CrudController
{
    protected function tabla(): string
    {
        return 'sectores';
    }

    protected function campoTitulo(): string
    {
        return 'nombre';
    }

    protected function camposBusqueda(): array
    {
        return ['nombre', 'descripcion'];
    }

    protected function reglas(): array
    {
        return [
            'nombre'      => ['requerido|texto|max:120', null],
            'slug'        => ['texto|slug|max:160', ''],
            'descripcion' => ['texto|max:400', ''],
            'icono'       => ['texto|max:60', 'building'],
            'imagen_id'   => ['entero', null],
            'orden'       => ['entero', 0],
            'activo'      => ['booleano', 1],
        ];
    }
}
