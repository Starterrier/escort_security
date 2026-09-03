<?php

declare(strict_types=1);

namespace Ess\Core;

use RuntimeException;

/**
 * Error controlado que se traduce directamente en una respuesta HTTP.
 */
class HttpException extends RuntimeException
{
    /** @var array<string,string> */
    private array $errores;

    /** @param array<string,string> $errores */
    public function __construct(string $mensaje, int $estado = 400, array $errores = [])
    {
        parent::__construct($mensaje, $estado);
        $this->errores = $errores;
    }

    public function estado(): int
    {
        $codigo = (int) $this->getCode();

        return ($codigo >= 400 && $codigo <= 599) ? $codigo : 500;
    }

    /** @return array<string,string> */
    public function errores(): array
    {
        return $this->errores;
    }

    /** @param array<string,string> $errores */
    public static function validacion(array $errores, string $mensaje = 'Los datos enviados no son validos.'): self
    {
        return new self($mensaje, 422, $errores);
    }

    public static function noAutenticado(string $mensaje = 'Debe iniciar sesion.'): self
    {
        return new self($mensaje, 401);
    }

    public static function prohibido(string $mensaje = 'No tiene permisos para esta accion.'): self
    {
        return new self($mensaje, 403);
    }

    public static function noEncontrado(string $mensaje = 'El recurso solicitado no existe.'): self
    {
        return new self($mensaje, 404);
    }

    public static function conflicto(string $mensaje): self
    {
        return new self($mensaje, 409);
    }

    public static function demasiadasPeticiones(string $mensaje): self
    {
        return new self($mensaje, 429);
    }
}
