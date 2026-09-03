<?php

declare(strict_types=1);

namespace Ess\Core;

/**
 * Cabeceras CORS restringidas a los origenes configurados.
 */
final class Cors
{
    public static function aplicar(): void
    {
        $origen = (string) ($_SERVER['HTTP_ORIGIN'] ?? '');

        if ($origen === '') {
            return;
        }

        /** @var array<int,string> $permitidos */
        $permitidos = (array) Config::get('cors.origenes', []);

        if (!in_array($origen, $permitidos, true)) {
            return;
        }

        header('Access-Control-Allow-Origin: ' . $origen);
        header('Vary: Origin');
        header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
        header('Access-Control-Max-Age: 86400');
    }

    /** Responde de inmediato a la preflight OPTIONS. */
    public static function manejarPreflight(): void
    {
        if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
            http_response_code(204);
            exit;
        }
    }
}
