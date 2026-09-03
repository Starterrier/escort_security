<?php

declare(strict_types=1);

namespace Ess\Core;

/**
 * Emision de respuestas JSON.
 */
final class Response
{
    /** @param mixed $datos */
    public static function json($datos, int $estado = 200): void
    {
        if (!headers_sent()) {
            http_response_code($estado);
            header('Content-Type: application/json; charset=utf-8');
            header('X-Content-Type-Options: nosniff');
        }

        echo json_encode(
            $datos,
            JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_INVALID_UTF8_SUBSTITUTE
        );
    }

    /** @param mixed $datos */
    public static function ok($datos = null, int $estado = 200): void
    {
        self::json(['ok' => true, 'datos' => $datos], $estado);
    }

    /**
     * @param array<int,array<string,mixed>> $items
     */
    public static function paginado(array $items, int $total, int $pagina, int $porPagina): void
    {
        self::json([
            'ok'    => true,
            'datos' => $items,
            'meta'  => [
                'total'      => $total,
                'pagina'     => $pagina,
                'por_pagina' => $porPagina,
                'paginas'    => $porPagina > 0 ? (int) ceil($total / $porPagina) : 0,
            ],
        ]);
    }

    /** @param array<string,string> $errores */
    public static function error(string $mensaje, int $estado = 400, array $errores = []): void
    {
        $carga = ['ok' => false, 'mensaje' => $mensaje];

        if ($errores !== []) {
            $carga['errores'] = $errores;
        }

        self::json($carga, $estado);
    }

    public static function sinContenido(): void
    {
        if (!headers_sent()) {
            http_response_code(204);
        }
    }
}
