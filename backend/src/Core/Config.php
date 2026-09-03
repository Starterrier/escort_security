<?php

declare(strict_types=1);

namespace Ess\Core;

use RuntimeException;

/**
 * Acceso de solo lectura al arreglo de configuracion, con rutas por puntos.
 */
final class Config
{
    /** @var array<string,mixed>|null */
    private static ?array $datos = null;

    public static function cargar(string $ruta): void
    {
        if (!is_file($ruta)) {
            throw new RuntimeException(
                'No se encontro config.php. Copie config/config.example.php como config/config.php.'
            );
        }

        $datos = require $ruta;

        if (!is_array($datos)) {
            throw new RuntimeException('config.php debe devolver un arreglo.');
        }

        self::$datos = $datos;
    }

    /**
     * @param  mixed $porDefecto
     * @return mixed
     */
    public static function get(string $clave, $porDefecto = null)
    {
        if (self::$datos === null) {
            throw new RuntimeException('La configuracion no ha sido cargada.');
        }

        $valor = self::$datos;

        foreach (explode('.', $clave) as $segmento) {
            if (!is_array($valor) || !array_key_exists($segmento, $valor)) {
                return $porDefecto;
            }
            $valor = $valor[$segmento];
        }

        return $valor;
    }

    public static function esProduccion(): bool
    {
        return self::get('entorno', 'produccion') === 'produccion';
    }
}
