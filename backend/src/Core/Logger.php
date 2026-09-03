<?php

declare(strict_types=1);

namespace Ess\Core;

/**
 * Registro de errores en archivo diario.
 */
final class Logger
{
    public static function error(string $mensaje): void
    {
        self::escribir('ERROR', $mensaje);
    }

    public static function info(string $mensaje): void
    {
        self::escribir('INFO', $mensaje);
    }

    private static function escribir(string $nivel, string $mensaje): void
    {
        $directorio = dirname(__DIR__, 2) . '/storage/logs';

        if (!is_dir($directorio) && !@mkdir($directorio, 0775, true) && !is_dir($directorio)) {
            return;
        }

        $linea = sprintf('[%s] %s: %s%s', date('Y-m-d H:i:s'), $nivel, $mensaje, PHP_EOL);

        @file_put_contents($directorio . '/api-' . date('Y-m-d') . '.log', $linea, FILE_APPEND | LOCK_EX);
    }
}
