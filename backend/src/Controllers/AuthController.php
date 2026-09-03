<?php

declare(strict_types=1);

namespace Ess\Controllers;

use Ess\Core\Auth;
use Ess\Core\Config;
use Ess\Core\Database;
use Ess\Core\HttpException;
use Ess\Core\Jwt;
use Ess\Core\Request;
use Ess\Core\Response;
use Ess\Core\Validator;

/**
 * Inicio de sesion del panel administrativo.
 */
final class AuthController
{
    public function login(Request $peticion): void
    {
        $datos = Validator::para($peticion->cuerpo())
            ->campo('email', 'requerido|texto|email|max:190')
            ->campo('clave', 'requerido|texto|min:6|max:200')
            ->validar();

        $email = strtolower((string) $datos['email']);
        $ip    = $peticion->ip();

        $this->verificarBloqueo($email, $ip);

        $usuario = Database::uno(
            'SELECT * FROM usuarios WHERE email = :email LIMIT 1',
            ['email' => $email]
        );

        $valida = $usuario !== null
            && (int) $usuario['activo'] === 1
            && password_verify((string) $datos['clave'], (string) $usuario['password_hash']);

        Database::insertar('intentos_acceso', [
            'email'   => $email,
            'ip'      => $ip,
            'exitoso' => $valida ? 1 : 0,
        ]);

        if (!$valida) {
            // Mensaje generico: no revela si el correo existe.
            throw new HttpException('Correo o contrasena incorrectos.', 401);
        }

        Database::actualizar('usuarios', (int) $usuario['id'], ['ultimo_acceso' => date('Y-m-d H:i:s')]);

        // Limpia los intentos fallidos previos de esa cuenta.
        Database::ejecutar('DELETE FROM intentos_acceso WHERE email = :email AND exitoso = 0', ['email' => $email]);

        Response::ok($this->emitirSesion($usuario));
    }

    public function yo(Request $peticion): void
    {
        $usuario = Database::uno(
            'SELECT id, nombre, email, rol, ultimo_acceso FROM usuarios WHERE id = :id',
            ['id' => $peticion->usuarioId()]
        );

        if ($usuario === null) {
            throw HttpException::noAutenticado();
        }

        Response::ok(['usuario' => Auth::perfil($usuario)]);
    }

    public function refrescar(Request $peticion): void
    {
        $usuario = Database::uno('SELECT * FROM usuarios WHERE id = :id', ['id' => $peticion->usuarioId()]);

        if ($usuario === null) {
            throw HttpException::noAutenticado();
        }

        Response::ok($this->emitirSesion($usuario));
    }

    public function cambiarClave(Request $peticion): void
    {
        $datos = Validator::para($peticion->cuerpo())
            ->campo('clave_actual', 'requerido|texto')
            ->campo('clave_nueva', 'requerido|texto|min:8|max:200')
            ->validar();

        $usuario = Database::uno('SELECT * FROM usuarios WHERE id = :id', ['id' => $peticion->usuarioId()]);

        if ($usuario === null || !password_verify((string) $datos['clave_actual'], (string) $usuario['password_hash'])) {
            throw HttpException::validacion(['clave_actual' => 'La contrasena actual no es correcta.']);
        }

        // Al cambiar la clave se invalidan los tokens emitidos antes.
        Database::actualizar('usuarios', (int) $usuario['id'], [
            'password_hash' => password_hash((string) $datos['clave_nueva'], PASSWORD_DEFAULT),
            'token_version' => (int) $usuario['token_version'] + 1,
        ]);

        $usuario['token_version'] = (int) $usuario['token_version'] + 1;

        Response::ok($this->emitirSesion($usuario));
    }

    public function salir(Request $peticion): void
    {
        // El token es sin estado: se invalida subiendo la version del usuario.
        Database::ejecutar(
            'UPDATE usuarios SET token_version = token_version + 1 WHERE id = :id',
            ['id' => $peticion->usuarioId()]
        );

        Response::ok(['mensaje' => 'Sesion cerrada.']);
    }

    /**
     * @param  array<string,mixed> $usuario
     * @return array<string,mixed>
     */
    private function emitirSesion(array $usuario): array
    {
        $token = Jwt::firmar([
            'sub' => (int) $usuario['id'],
            'rol' => (string) $usuario['rol'],
            'ver' => (int) $usuario['token_version'],
        ]);

        return [
            'token'   => $token,
            'expira'  => Jwt::expiracion($token),
            'usuario' => Auth::perfil($usuario),
        ];
    }

    /**
     * Bloquea temporalmente tras varios intentos fallidos.
     *
     * @throws HttpException
     */
    private function verificarBloqueo(string $email, string $ip): void
    {
        $maximo  = (int) Config::get('seguridad.max_intentos_login', 5);
        $minutos = (int) Config::get('seguridad.minutos_bloqueo', 15);

        // $minutos proviene de la configuracion, no de la peticion: es seguro
        // interpolarlo y evita el casting implicito del marcador en INTERVAL.
        $fallidos = (int) Database::valor(
            'SELECT COUNT(*) FROM intentos_acceso
             WHERE exitoso = 0 AND (email = :email OR ip = :ip)
               AND creado_en > DATE_SUB(NOW(), INTERVAL ' . $minutos . ' MINUTE)',
            ['email' => $email, 'ip' => $ip]
        );

        if ($fallidos >= $maximo) {
            throw HttpException::demasiadasPeticiones(
                'Demasiados intentos fallidos. Espere ' . $minutos . ' minutos e intentelo de nuevo.'
            );
        }
    }
}
