<?php

declare(strict_types=1);

namespace Ess\Core;

/**
 * Enrutador minimo con parametros nombrados: /servicios/{id}
 */
final class Router
{
    /** @var array<int,array{metodo:string,patron:string,regex:string,claves:array<int,string>,accion:callable,auth:bool,rol:?string}> */
    private array $rutas = [];

    public function get(string $patron, callable $accion): self
    {
        return $this->agregar('GET', $patron, $accion);
    }

    public function post(string $patron, callable $accion): self
    {
        return $this->agregar('POST', $patron, $accion);
    }

    public function put(string $patron, callable $accion): self
    {
        return $this->agregar('PUT', $patron, $accion);
    }

    public function patch(string $patron, callable $accion): self
    {
        return $this->agregar('PATCH', $patron, $accion);
    }

    public function delete(string $patron, callable $accion): self
    {
        return $this->agregar('DELETE', $patron, $accion);
    }

    /**
     * Marca la ultima ruta registrada como protegida.
     *
     * @param string|null $rol Si se indica, exige ademas ese rol.
     */
    public function protegida(?string $rol = null): self
    {
        $ultima = array_key_last($this->rutas);

        if ($ultima !== null) {
            $this->rutas[$ultima]['auth'] = true;
            $this->rutas[$ultima]['rol']  = $rol;
        }

        return $this;
    }

    private function agregar(string $metodo, string $patron, callable $accion): self
    {
        $claves = [];

        $regex = preg_replace_callback(
            '/\{([a-zA-Z_][a-zA-Z0-9_]*)\}/',
            static function (array $c) use (&$claves): string {
                $claves[] = $c[1];

                return '([^/]+)';
            },
            $patron
        );

        $this->rutas[] = [
            'metodo' => $metodo,
            'patron' => $patron,
            'regex'  => '#^' . $regex . '$#',
            'claves' => $claves,
            'accion' => $accion,
            'auth'   => false,
            'rol'    => null,
        ];

        return $this;
    }

    /**
     * Resuelve la peticion. Devuelve el resultado de la accion.
     *
     * @throws HttpException
     */
    public function despachar(Request $peticion): void
    {
        $ruta      = $peticion->ruta();
        $metodo    = $peticion->metodo();
        $permitidos = [];

        foreach ($this->rutas as $definicion) {
            if (preg_match($definicion['regex'], $ruta, $coincidencias) !== 1) {
                continue;
            }

            if ($definicion['metodo'] !== $metodo) {
                $permitidos[] = $definicion['metodo'];
                continue;
            }

            array_shift($coincidencias);
            $parametros = [];
            foreach ($definicion['claves'] as $indice => $clave) {
                $parametros[$clave] = urldecode((string) ($coincidencias[$indice] ?? ''));
            }
            $peticion->definirParametros($parametros);

            if ($definicion['auth']) {
                Auth::exigir($peticion, $definicion['rol']);
            }

            ($definicion['accion'])($peticion);

            return;
        }

        if ($permitidos !== []) {
            header('Allow: ' . implode(', ', array_unique($permitidos)));
            throw new HttpException('Metodo no permitido para esta ruta.', 405);
        }

        throw HttpException::noEncontrado('La ruta ' . $ruta . ' no existe en la API.');
    }
}
