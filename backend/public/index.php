<?php

declare(strict_types=1);

/**
 * Punto de entrada unico de la API de ESCORT SECURITY SERVICES.
 */

use Ess\Core\Config;
use Ess\Core\Cors;
use Ess\Core\HttpException;
use Ess\Core\Logger;
use Ess\Core\Request;
use Ess\Core\Response;
use Ess\Core\Router;

// Raiz del backend. En hosting compartido, donde `public/` va dentro de
// public_html y el resto queda fuera, se indica con:
//   SetEnv ESS_RAIZ /home/usuario/ess-backend
define('ESS_RAIZ', getenv('ESS_RAIZ') ?: dirname(__DIR__));

// --- Autocarga PSR-4 sencilla (sin Composer) --------------------------------
spl_autoload_register(static function (string $clase): void {
    $prefijo = 'Ess\\';

    if (strncmp($clase, $prefijo, strlen($prefijo)) !== 0) {
        return;
    }

    $relativa = substr($clase, strlen($prefijo));
    $ruta     = ESS_RAIZ . '/src/' . str_replace('\\', '/', $relativa) . '.php';

    if (is_file($ruta)) {
        require $ruta;
    }
});

try {
    Config::cargar(ESS_RAIZ . '/config/config.php');
} catch (Throwable $e) {
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['ok' => false, 'mensaje' => $e->getMessage()], JSON_UNESCAPED_UNICODE);
    exit;
}

// --- Presentacion de errores segun entorno ----------------------------------
if (Config::esProduccion()) {
    ini_set('display_errors', '0');
} else {
    ini_set('display_errors', '1');
    error_reporting(E_ALL);
}

date_default_timezone_set('America/Bogota');

Cors::aplicar();
Cors::manejarPreflight();

$peticion = new Request();
$router   = new Router();

require ESS_RAIZ . '/src/rutas.php';

try {
    $router->despachar($peticion);
} catch (HttpException $e) {
    Response::error($e->getMessage(), $e->estado(), $e->errores());
} catch (Throwable $e) {
    Logger::error($e->getMessage() . ' @ ' . $e->getFile() . ':' . $e->getLine());

    Response::error(
        Config::esProduccion()
            ? 'Ocurrio un error inesperado. Intentelo de nuevo en unos minutos.'
            : $e->getMessage() . ' @ ' . $e->getFile() . ':' . $e->getLine(),
        500
    );
}
