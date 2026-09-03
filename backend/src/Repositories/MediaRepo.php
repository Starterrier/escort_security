<?php

declare(strict_types=1);

namespace Ess\Repositories;

use Ess\Core\Config;
use Ess\Core\Database;

/**
 * Consulta de la biblioteca de medios y construccion de URLs publicas.
 */
final class MediaRepo
{
    /** @var array<int,array<string,mixed>|null> */
    private static array $cache = [];

    public static function urlBase(): string
    {
        return rtrim((string) Config::get('uploads.url_base', '/api/uploads'), '/');
    }

    /**
     * @param  array<string,mixed> $fila Fila de la tabla `media`.
     * @return array<string,mixed>
     */
    public static function formatear(array $fila): array
    {
        return [
            'id'              => (int) $fila['id'],
            'url'             => self::urlBase() . '/' . $fila['archivo'],
            'archivo'         => (string) $fila['archivo'],
            'nombre_original' => (string) $fila['nombre_original'],
            'mime'            => (string) $fila['mime'],
            'peso'            => (int) $fila['peso'],
            'ancho'           => $fila['ancho'] !== null ? (int) $fila['ancho'] : null,
            'alto'            => $fila['alto'] !== null ? (int) $fila['alto'] : null,
            'alt'             => (string) $fila['alt'],
            'creado_en'       => $fila['creado_en'] ?? null,
        ];
    }

    /**
     * Devuelve el medio ya formateado, o null si el id es nulo o no existe.
     *
     * @return array<string,mixed>|null
     */
    public static function buscar(?int $id): ?array
    {
        if ($id === null || $id <= 0) {
            return null;
        }

        if (array_key_exists($id, self::$cache)) {
            return self::$cache[$id];
        }

        $fila = Database::uno('SELECT * FROM media WHERE id = :id', ['id' => $id]);

        return self::$cache[$id] = $fila === null ? null : self::formatear($fila);
    }

    /**
     * Adjunta la clave `imagen` a cada fila que tenga `imagen_id`.
     *
     * @param  array<int,array<string,mixed>> $filas
     * @return array<int,array<string,mixed>>
     */
    public static function adjuntar(array $filas, string $campo = 'imagen_id', string $destino = 'imagen'): array
    {
        $ids = [];
        foreach ($filas as $fila) {
            $id = (int) ($fila[$campo] ?? 0);
            if ($id > 0 && !array_key_exists($id, self::$cache)) {
                $ids[$id] = $id;
            }
        }

        if ($ids !== []) {
            $marcadores = implode(',', array_fill(0, count($ids), '?'));
            $sentencia  = Database::conexion()->prepare("SELECT * FROM media WHERE id IN ($marcadores)");
            $sentencia->execute(array_values($ids));

            foreach ($sentencia->fetchAll() as $medio) {
                self::$cache[(int) $medio['id']] = self::formatear($medio);
            }
            foreach ($ids as $id) {
                self::$cache[$id] = self::$cache[$id] ?? null;
            }
        }

        foreach ($filas as $indice => $fila) {
            $filas[$indice][$destino] = self::buscar((int) ($fila[$campo] ?? 0));
        }

        return $filas;
    }

    public static function invalidarCache(): void
    {
        self::$cache = [];
    }
}
