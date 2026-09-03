<?php

declare(strict_types=1);

namespace Ess\Controllers;

use Ess\Core\Database;
use Ess\Core\HttpException;
use Ess\Core\Request;
use Ess\Core\Response;
use Ess\Core\Validator;
use Ess\Repositories\MediaRepo;

/**
 * Base para los recursos administrables sencillos (sectores, slides, paginas).
 *
 * Las subclases declaran la tabla, el orden y las reglas de validacion.
 */
abstract class CrudController
{
    abstract protected function tabla(): string;

    /** Campos por los que busca el filtro `q`. @return array<int,string> */
    abstract protected function camposBusqueda(): array;

    /**
     * Reglas de validacion: campo => [reglas, valorPorDefectoAlCrear].
     *
     * @return array<string,array{0:string,1:mixed}>
     */
    abstract protected function reglas(): array;

    protected function ordenPorDefecto(): string
    {
        return 'orden ASC, id ASC';
    }

    /** Campo unico con slug automatico; null si el recurso no usa slug. */
    protected function campoSlug(): ?string
    {
        return 'slug';
    }

    /** Campo del que se deriva el slug cuando no se envia. */
    abstract protected function campoTitulo(): string;

    public function listar(Request $peticion): void
    {
        $condiciones = [];
        $parametros  = [];

        $busqueda = $peticion->consulta('q');
        if ($busqueda !== null && $this->camposBusqueda() !== []) {
            // Un marcador por campo: MySQL no admite reutilizar el mismo
            // nombre varias veces con sentencias preparadas reales.
            $piezas = [];
            foreach ($this->camposBusqueda() as $indice => $campo) {
                $piezas[]                  = $campo . ' LIKE :q' . $indice;
                $parametros['q' . $indice] = '%' . $busqueda . '%';
            }
            $condiciones[] = '(' . implode(' OR ', $piezas) . ')';
        }

        $activo = $peticion->consultaBool('activo');
        if ($activo !== null) {
            $condiciones[]        = 'activo = :activo';
            $parametros['activo'] = $activo ? 1 : 0;
        }

        $where = $condiciones === [] ? '' : ' WHERE ' . implode(' AND ', $condiciones);

        $filas = Database::todos(
            'SELECT * FROM ' . $this->tabla() . $where . ' ORDER BY ' . $this->ordenPorDefecto(),
            $parametros
        );

        Response::ok(MediaRepo::adjuntar($filas));
    }

    public function ver(Request $peticion): void
    {
        $fila           = $this->obtener($peticion->parametroEntero('id'));
        $fila['imagen'] = MediaRepo::buscar((int) ($fila['imagen_id'] ?? 0));

        Response::ok($fila);
    }

    public function crear(Request $peticion): void
    {
        $datos = $this->validar($peticion, true);

        $campoSlug = $this->campoSlug();
        if ($campoSlug !== null) {
            $base = (string) ($datos[$campoSlug] ?? '');
            if ($base === '') {
                $base = Validator::slug((string) ($datos[$this->campoTitulo()] ?? ''));
            }
            $datos[$campoSlug] = $this->slugUnico($base);
        }

        $id = Database::insertar($this->tabla(), $datos);

        $fila           = $this->obtener($id);
        $fila['imagen'] = MediaRepo::buscar((int) ($fila['imagen_id'] ?? 0));

        Response::ok($fila, 201);
    }

    public function actualizar(Request $peticion): void
    {
        $id       = $peticion->parametroEntero('id');
        $original = $this->obtener($id);
        $datos    = $this->validar($peticion, false);

        $campoSlug = $this->campoSlug();
        if ($campoSlug !== null && isset($datos[$campoSlug]) && $datos[$campoSlug] !== $original[$campoSlug]) {
            $datos[$campoSlug] = $this->slugUnico((string) $datos[$campoSlug], $id);
        }

        if ($datos !== []) {
            Database::actualizar($this->tabla(), $id, $datos);
        }

        $fila           = $this->obtener($id);
        $fila['imagen'] = MediaRepo::buscar((int) ($fila['imagen_id'] ?? 0));

        Response::ok($fila);
    }

    public function eliminar(Request $peticion): void
    {
        $id   = $peticion->parametroEntero('id');
        $fila = $this->obtener($id);

        if ((int) ($fila['sistema'] ?? 0) === 1) {
            throw HttpException::conflicto('Este registro es del sistema y no se puede eliminar. Puede desactivarlo.');
        }

        Database::ejecutar('DELETE FROM ' . $this->tabla() . ' WHERE id = :id', ['id' => $id]);

        Response::ok(['mensaje' => 'Registro eliminado.']);
    }

    public function reordenar(Request $peticion): void
    {
        $ids = $peticion->entrada('orden', []);

        if (!is_array($ids) || $ids === []) {
            throw HttpException::validacion(['orden' => 'Envie el arreglo de identificadores.']);
        }

        $tabla = $this->tabla();

        Database::transaccion(static function () use ($ids, $tabla): void {
            foreach (array_values($ids) as $posicion => $id) {
                Database::ejecutar(
                    'UPDATE ' . $tabla . ' SET orden = :orden WHERE id = :id',
                    ['orden' => $posicion, 'id' => (int) $id]
                );
            }
        });

        Response::ok(['mensaje' => 'Orden actualizado.']);
    }

    // -----------------------------------------------------------------------

    /** @return array<string,mixed> */
    protected function obtener(int $id): array
    {
        $fila = Database::uno('SELECT * FROM ' . $this->tabla() . ' WHERE id = :id', ['id' => $id]);

        if ($fila === null) {
            throw HttpException::noEncontrado('El registro solicitado no existe.');
        }

        return $fila;
    }

    /** @return array<string,mixed> */
    protected function validar(Request $peticion, bool $creando): array
    {
        $validador = Validator::para($peticion->cuerpo());

        foreach ($this->reglas() as $campo => $definicion) {
            [$reglas, $porDefecto] = $definicion;

            if (!$creando) {
                $reglas = str_replace(['requerido|', '|requerido', 'requerido'], '', $reglas);
                $porDefecto = null;
            }

            $validador->campo($campo, trim($reglas, '|'), $porDefecto);
        }

        $datos = $validador->validar();

        return array_filter($datos, static fn ($v): bool => $v !== null);
    }

    protected function slugUnico(string $base, ?int $excluirId = null): string
    {
        $campo = (string) $this->campoSlug();
        $base  = $base !== '' ? $base : 'registro';
        $slug  = $base;
        $n     = 2;

        while (true) {
            $sql = 'SELECT COUNT(*) FROM ' . $this->tabla() . ' WHERE ' . $campo . ' = :slug'
                . ($excluirId !== null ? ' AND id <> :id' : '');
            $parametros = ['slug' => $slug];
            if ($excluirId !== null) {
                $parametros['id'] = $excluirId;
            }

            if ((int) Database::valor($sql, $parametros) === 0) {
                return $slug;
            }

            $slug = $base . '-' . $n++;
        }
    }
}
