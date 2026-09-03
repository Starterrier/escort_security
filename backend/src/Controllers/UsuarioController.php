<?php

declare(strict_types=1);

namespace Ess\Controllers;

use Ess\Core\Auth;
use Ess\Core\Database;
use Ess\Core\HttpException;
use Ess\Core\Request;
use Ess\Core\Response;
use Ess\Core\Validator;

/**
 * Gestion de usuarios del panel. Solo accesible para el perfil `admin`.
 */
final class UsuarioController
{
    public function listar(Request $peticion): void
    {
        $filas = Database::todos(
            'SELECT id, nombre, email, rol, activo, ultimo_acceso, creado_en
             FROM usuarios ORDER BY nombre ASC'
        );

        Response::ok($filas);
    }

    public function crear(Request $peticion): void
    {
        $datos = Validator::para($peticion->cuerpo())
            ->campo('nombre', 'requerido|texto|max:120')
            ->campo('email', 'requerido|texto|email|max:190')
            ->campo('clave', 'requerido|texto|min:8|max:200')
            ->campo('rol', 'texto|en:admin,editor', 'editor')
            ->campo('activo', 'booleano', 1)
            ->validar();

        $email = strtolower((string) $datos['email']);

        if ((int) Database::valor('SELECT COUNT(*) FROM usuarios WHERE email = :email', ['email' => $email]) > 0) {
            throw HttpException::validacion(['email' => 'Ya existe un usuario con este correo.']);
        }

        $id = Database::insertar('usuarios', [
            'nombre'        => (string) $datos['nombre'],
            'email'         => $email,
            'password_hash' => password_hash((string) $datos['clave'], PASSWORD_DEFAULT),
            'rol'           => (string) $datos['rol'],
            'activo'        => (int) $datos['activo'],
        ]);

        Response::ok(Auth::perfil($this->obtener($id)), 201);
    }

    public function actualizar(Request $peticion): void
    {
        $id      = $peticion->parametroEntero('id');
        $usuario = $this->obtener($id);

        $datos = Validator::para($peticion->cuerpo())
            ->campo('nombre', 'texto|max:120')
            ->campo('email', 'texto|email|max:190')
            ->campo('clave', 'texto|min:8|max:200')
            ->campo('rol', 'texto|en:admin,editor')
            ->campo('activo', 'booleano')
            ->validar();

        $cambios = [];

        if (isset($datos['nombre'])) {
            $cambios['nombre'] = (string) $datos['nombre'];
        }

        if (isset($datos['email'])) {
            $email = strtolower((string) $datos['email']);
            $usado = (int) Database::valor(
                'SELECT COUNT(*) FROM usuarios WHERE email = :email AND id <> :id',
                ['email' => $email, 'id' => $id]
            );
            if ($usado > 0) {
                throw HttpException::validacion(['email' => 'Ya existe un usuario con este correo.']);
            }
            $cambios['email'] = $email;
        }

        if (isset($datos['rol'])) {
            $this->protegerUltimoAdmin($usuario, $datos['rol'] !== 'admin');
            $cambios['rol'] = (string) $datos['rol'];
        }

        if (isset($datos['activo'])) {
            $this->protegerUltimoAdmin($usuario, (int) $datos['activo'] === 0);
            $cambios['activo'] = (int) $datos['activo'];

            if ((int) $datos['activo'] === 0) {
                $cambios['token_version'] = (int) $usuario['token_version'] + 1;
            }
        }

        if (isset($datos['clave']) && $datos['clave'] !== '') {
            $cambios['password_hash'] = password_hash((string) $datos['clave'], PASSWORD_DEFAULT);
            $cambios['token_version'] = (int) $usuario['token_version'] + 1;
        }

        if ($cambios !== []) {
            Database::actualizar('usuarios', $id, $cambios);
        }

        Response::ok(Auth::perfil($this->obtener($id)));
    }

    public function eliminar(Request $peticion): void
    {
        $id = $peticion->parametroEntero('id');

        if ($id === $peticion->usuarioId()) {
            throw HttpException::conflicto('No puede eliminar su propia cuenta.');
        }

        $usuario = $this->obtener($id);
        $this->protegerUltimoAdmin($usuario, true);

        Database::ejecutar('DELETE FROM usuarios WHERE id = :id', ['id' => $id]);

        Response::ok(['mensaje' => 'Usuario eliminado.']);
    }

    // -----------------------------------------------------------------------

    /** @return array<string,mixed> */
    private function obtener(int $id): array
    {
        $fila = Database::uno('SELECT * FROM usuarios WHERE id = :id', ['id' => $id]);

        if ($fila === null) {
            throw HttpException::noEncontrado('El usuario no existe.');
        }

        return $fila;
    }

    /**
     * Impide quedarse sin ningun administrador activo.
     *
     * @param array<string,mixed> $usuario
     */
    private function protegerUltimoAdmin(array $usuario, bool $perderiaAdmin): void
    {
        if (!$perderiaAdmin || $usuario['rol'] !== 'admin' || (int) $usuario['activo'] !== 1) {
            return;
        }

        $adminsActivos = (int) Database::valor(
            "SELECT COUNT(*) FROM usuarios WHERE rol = 'admin' AND activo = 1"
        );

        if ($adminsActivos <= 1) {
            throw HttpException::conflicto(
                'Debe existir al menos un administrador activo. Cree otro antes de hacer este cambio.'
            );
        }
    }
}
