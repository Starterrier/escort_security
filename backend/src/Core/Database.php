<?php

declare(strict_types=1);

namespace Ess\Core;

use PDO;
use PDOException;
use RuntimeException;

/**
 * Conexion PDO unica y utilidades de consulta.
 */
final class Database
{
    private static ?PDO $pdo = null;

    public static function conexion(): PDO
    {
        if (self::$pdo instanceof PDO) {
            return self::$pdo;
        }

        $host    = (string) Config::get('db.host', '127.0.0.1');
        $puerto  = (int) Config::get('db.puerto', 3306);
        $nombre  = (string) Config::get('db.nombre', '');
        $charset = (string) Config::get('db.charset', 'utf8mb4');

        $dsn = sprintf('mysql:host=%s;port=%d;dbname=%s;charset=%s', $host, $puerto, $nombre, $charset);

        try {
            self::$pdo = new PDO(
                $dsn,
                (string) Config::get('db.usuario', ''),
                (string) Config::get('db.clave', ''),
                [
                    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES   => false,
                ]
            );
        } catch (PDOException $e) {
            throw new RuntimeException('No fue posible conectar con la base de datos: ' . $e->getMessage(), 0, $e);
        }

        return self::$pdo;
    }

    /**
     * @param  array<string,mixed> $parametros
     * @return array<int,array<string,mixed>>
     */
    public static function todos(string $sql, array $parametros = []): array
    {
        $sentencia = self::conexion()->prepare($sql);
        $sentencia->execute($parametros);

        return $sentencia->fetchAll();
    }

    /**
     * @param  array<string,mixed> $parametros
     * @return array<string,mixed>|null
     */
    public static function uno(string $sql, array $parametros = []): ?array
    {
        $sentencia = self::conexion()->prepare($sql);
        $sentencia->execute($parametros);
        $fila = $sentencia->fetch();

        return $fila === false ? null : $fila;
    }

    /**
     * @param  array<string,mixed> $parametros
     * @return mixed
     */
    public static function valor(string $sql, array $parametros = [])
    {
        $sentencia = self::conexion()->prepare($sql);
        $sentencia->execute($parametros);
        $valor = $sentencia->fetchColumn();

        return $valor === false ? null : $valor;
    }

    /**
     * Ejecuta una sentencia y devuelve el numero de filas afectadas.
     *
     * @param array<string,mixed> $parametros
     */
    public static function ejecutar(string $sql, array $parametros = []): int
    {
        $sentencia = self::conexion()->prepare($sql);
        $sentencia->execute($parametros);

        return $sentencia->rowCount();
    }

    /**
     * Inserta y devuelve el id generado.
     *
     * @param array<string,mixed> $datos
     */
    public static function insertar(string $tabla, array $datos): int
    {
        $columnas   = array_keys($datos);
        $marcadores = array_map(static fn (string $c): string => ':' . $c, $columnas);

        $sql = sprintf(
            'INSERT INTO %s (%s) VALUES (%s)',
            $tabla,
            implode(', ', $columnas),
            implode(', ', $marcadores)
        );

        self::ejecutar($sql, $datos);

        return (int) self::conexion()->lastInsertId();
    }

    /**
     * Actualiza por id y devuelve las filas afectadas.
     *
     * @param array<string,mixed> $datos
     */
    public static function actualizar(string $tabla, int $id, array $datos): int
    {
        if ($datos === []) {
            return 0;
        }

        $asignaciones = array_map(static fn (string $c): string => $c . ' = :' . $c, array_keys($datos));
        $sql = sprintf('UPDATE %s SET %s WHERE id = :id_where', $tabla, implode(', ', $asignaciones));

        return self::ejecutar($sql, $datos + ['id_where' => $id]);
    }

    public static function transaccion(callable $callback)
    {
        $pdo = self::conexion();
        $pdo->beginTransaction();

        try {
            $resultado = $callback($pdo);
            $pdo->commit();

            return $resultado;
        } catch (\Throwable $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            throw $e;
        }
    }
}
