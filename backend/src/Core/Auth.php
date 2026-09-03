<?php

declare(strict_types=1);

namespace Ess\Core;

/**
 * Resolucion del usuario autenticado a partir del token portador.
 */
final class Auth
{
    /**
     * Carga el usuario en la peticion y verifica el rol exigido.
     *
     * @throws HttpException
     */
    public static function exigir(Request $peticion, ?string $rol = null): void
    {
        $token = $peticion->tokenPortador();

        if ($token === null) {
            throw HttpException::noAutenticado('Falta el token de acceso.');
        }

        $carga = Jwt::verificar($token);

        if ($carga === null) {
            throw HttpException::noAutenticado('La sesion expiro o el token no es valido.');
        }

        $usuario = Database::uno(
            'SELECT id, nombre, email, rol, activo, token_version FROM usuarios WHERE id = :id',
            ['id' => (int) ($carga['sub'] ?? 0)]
        );

        if ($usuario === null || (int) $usuario['activo'] !== 1) {
            throw HttpException::noAutenticado('La cuenta no existe o fue desactivada.');
        }

        // Permite invalidar sesiones al cambiar la clave o desactivar la cuenta.
        if ((int) $usuario['token_version'] !== (int) ($carga['ver'] ?? 0)) {
            throw HttpException::noAutenticado('La sesion fue cerrada. Vuelva a iniciar sesion.');
        }

        $peticion->definirUsuario([
            'id'     => (int) $usuario['id'],
            'nombre' => $usuario['nombre'],
            'email'  => $usuario['email'],
            'rol'    => $usuario['rol'],
        ]);

        if ($rol !== null && $usuario['rol'] !== $rol) {
            throw HttpException::prohibido('Esta accion requiere el perfil de ' . $rol . '.');
        }
    }

    /**
     * Datos publicos del usuario para devolver al cliente.
     *
     * @param  array<string,mixed> $fila
     * @return array<string,mixed>
     */
    public static function perfil(array $fila): array
    {
        return [
            'id'            => (int) $fila['id'],
            'nombre'        => (string) $fila['nombre'],
            'email'         => (string) $fila['email'],
            'rol'           => (string) $fila['rol'],
            'ultimo_acceso' => $fila['ultimo_acceso'] ?? null,
        ];
    }
}
