<?php

declare(strict_types=1);

namespace Ess\Core;

/**
 * Envoltura de la peticion HTTP entrante.
 */
final class Request
{
    private string $metodo;
    private string $ruta;
    /** @var array<string,mixed> */
    private array $cuerpo;
    /** @var array<string,string> */
    private array $consulta;
    /** @var array<string,string> */
    private array $parametros = [];
    /** @var array<string,mixed>|null */
    private ?array $usuario = null;

    public function __construct()
    {
        $this->metodo = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
        $this->ruta   = $this->resolverRuta();
        $this->cuerpo = $this->leerCuerpo();

        /** @var array<string,string> $consulta */
        $consulta = array_map(
            static fn ($v): string => is_array($v) ? (string) reset($v) : (string) $v,
            $_GET
        );
        $this->consulta = $consulta;
    }

    private function resolverRuta(): string
    {
        // Soporta ?_ruta=/x (fallback sin mod_rewrite) y PATH_INFO / REQUEST_URI.
        $ruta = $_GET['_ruta'] ?? null;

        if ($ruta === null) {
            $uri  = (string) ($_SERVER['REQUEST_URI'] ?? '/');
            $ruta = (string) parse_url($uri, PHP_URL_PATH);

            // Descarta el directorio base donde vive index.php (ej. /api).
            $script = str_replace('\\', '/', dirname((string) ($_SERVER['SCRIPT_NAME'] ?? '')));
            if ($script !== '' && $script !== '/' && strpos($ruta, $script) === 0) {
                $ruta = substr($ruta, strlen($script));
            }
        }

        $ruta = '/' . trim((string) $ruta, '/');

        return $ruta === '/' ? '/' : rtrim($ruta, '/');
    }

    /** @return array<string,mixed> */
    private function leerCuerpo(): array
    {
        $tipo = (string) ($_SERVER['CONTENT_TYPE'] ?? '');

        if (stripos($tipo, 'application/json') !== false) {
            $crudo = (string) file_get_contents('php://input');
            if ($crudo === '') {
                return [];
            }
            $datos = json_decode($crudo, true);

            return is_array($datos) ? $datos : [];
        }

        // multipart/form-data y x-www-form-urlencoded.
        return $_POST;
    }

    public function metodo(): string
    {
        return $this->metodo;
    }

    public function ruta(): string
    {
        return $this->ruta;
    }

    /** @return array<string,mixed> */
    public function cuerpo(): array
    {
        return $this->cuerpo;
    }

    /**
     * @param  mixed $porDefecto
     * @return mixed
     */
    public function entrada(string $clave, $porDefecto = null)
    {
        return $this->cuerpo[$clave] ?? $porDefecto;
    }

    public function consulta(string $clave, ?string $porDefecto = null): ?string
    {
        $valor = $this->consulta[$clave] ?? null;

        return ($valor === null || $valor === '') ? $porDefecto : $valor;
    }

    public function consultaEntero(string $clave, int $porDefecto): int
    {
        $valor = $this->consulta($clave);

        return ($valor !== null && is_numeric($valor)) ? (int) $valor : $porDefecto;
    }

    public function consultaBool(string $clave): ?bool
    {
        $valor = $this->consulta($clave);
        if ($valor === null) {
            return null;
        }

        return in_array(strtolower($valor), ['1', 'true', 'si', 'yes'], true);
    }

    /** @param array<string,string> $parametros */
    public function definirParametros(array $parametros): void
    {
        $this->parametros = $parametros;
    }

    public function parametro(string $clave, string $porDefecto = ''): string
    {
        return $this->parametros[$clave] ?? $porDefecto;
    }

    public function parametroEntero(string $clave): int
    {
        return (int) ($this->parametros[$clave] ?? 0);
    }

    /** @param array<string,mixed>|null $usuario */
    public function definirUsuario(?array $usuario): void
    {
        $this->usuario = $usuario;
    }

    /** @return array<string,mixed>|null */
    public function usuario(): ?array
    {
        return $this->usuario;
    }

    public function usuarioId(): int
    {
        return (int) ($this->usuario['id'] ?? 0);
    }

    public function esAdmin(): bool
    {
        return ($this->usuario['rol'] ?? '') === 'admin';
    }

    public function tokenPortador(): ?string
    {
        $cabecera = $_SERVER['HTTP_AUTHORIZATION']
            ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION']
            ?? '';

        if ($cabecera === '' && function_exists('apache_request_headers')) {
            $cabeceras = array_change_key_case((array) apache_request_headers(), CASE_LOWER);
            $cabecera  = (string) ($cabeceras['authorization'] ?? '');
        }

        if (preg_match('/^Bearer\s+(.+)$/i', trim((string) $cabecera), $coincidencias) === 1) {
            return trim($coincidencias[1]);
        }

        return null;
    }

    public function ip(): string
    {
        return substr((string) ($_SERVER['REMOTE_ADDR'] ?? ''), 0, 45);
    }

    public function agente(): string
    {
        return substr((string) ($_SERVER['HTTP_USER_AGENT'] ?? ''), 0, 255);
    }
}
