<?php

declare(strict_types=1);

/**
 * Router para el servidor embebido de PHP (solo desarrollo):
 *   php -S 127.0.0.1:8391 -t public public/router-dev.php
 *
 * Sirve los archivos existentes tal cual y envia el resto a index.php.
 * En produccion esta tarea la hace .htaccess y este archivo no se usa.
 */

$ruta = (string) parse_url((string) ($_SERVER['REQUEST_URI'] ?? '/'), PHP_URL_PATH);

if ($ruta !== '/' && is_file(__DIR__ . $ruta) && substr($ruta, -4) !== '.php') {
    return false;
}

require __DIR__ . '/index.php';
