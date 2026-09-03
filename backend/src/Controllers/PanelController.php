<?php

declare(strict_types=1);

namespace Ess\Controllers;

use Ess\Core\Database;
use Ess\Core\Request;
use Ess\Core\Response;

/**
 * Resumen que ve el administrador al entrar al panel.
 */
final class PanelController
{
    public function resumen(Request $peticion): void
    {
        $conteos = [
            'servicios'         => (int) Database::valor('SELECT COUNT(*) FROM servicios WHERE activo = 1'),
            'servicios_totales' => (int) Database::valor('SELECT COUNT(*) FROM servicios'),
            'sectores'          => (int) Database::valor('SELECT COUNT(*) FROM sectores WHERE activo = 1'),
            'paginas'           => (int) Database::valor('SELECT COUNT(*) FROM paginas WHERE activo = 1'),
            'slides'            => (int) Database::valor('SELECT COUNT(*) FROM slides WHERE activo = 1'),
            'medios'            => (int) Database::valor('SELECT COUNT(*) FROM media'),
            'solicitudes_nuevas' => (int) Database::valor("SELECT COUNT(*) FROM solicitudes WHERE estado = 'nueva'"),
            'solicitudes_totales' => (int) Database::valor('SELECT COUNT(*) FROM solicitudes'),
        ];

        $ultimas = Database::todos(
            'SELECT id, nombre, email, empresa, estado, creado_en
             FROM solicitudes ORDER BY creado_en DESC, id DESC LIMIT 5'
        );

        // Solicitudes por dia de los ultimos 14 dias, para el grafico del panel.
        $serie = Database::todos(
            'SELECT DATE(creado_en) AS dia, COUNT(*) AS total
             FROM solicitudes
             WHERE creado_en > DATE_SUB(NOW(), INTERVAL 14 DAY)
             GROUP BY DATE(creado_en) ORDER BY dia ASC'
        );

        Response::ok([
            'conteos'             => $conteos,
            'ultimas_solicitudes' => $ultimas,
            'serie_solicitudes'   => array_map(
                static fn (array $f): array => ['dia' => (string) $f['dia'], 'total' => (int) $f['total']],
                $serie
            ),
        ]);
    }
}
