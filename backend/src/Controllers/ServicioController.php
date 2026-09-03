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
 * CRUD de servicios y de sus vinetas de alcance.
 */
final class ServicioController
{
    /** Listado para el panel (incluye inactivos). */
    public function listar(Request $peticion): void
    {
        $condiciones = [];
        $parametros  = [];

        $busqueda = $peticion->consulta('q');
        if ($busqueda !== null) {
            // Un marcador por campo: MySQL no admite reutilizar el mismo
            // nombre varias veces con sentencias preparadas reales.
            $piezas = [];
            foreach (['titulo', 'resumen', 'categoria'] as $indice => $campo) {
                $piezas[]                    = $campo . ' LIKE :q' . $indice;
                $parametros['q' . $indice]   = '%' . $busqueda . '%';
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
            'SELECT * FROM servicios' . $where . ' ORDER BY orden ASC, titulo ASC',
            $parametros
        );

        Response::ok(MediaRepo::adjuntar($filas));
    }

    public function ver(Request $peticion): void
    {
        $servicio = $this->obtener($peticion->parametroEntero('id'));

        Response::ok($this->conRelaciones($servicio));
    }

    public function crear(Request $peticion): void
    {
        $datos = $this->validar($peticion, true);
        $items = $this->itemsDeEntrada($peticion);

        $datos['slug'] = $this->slugUnico($datos['slug'] ?: Validator::slug((string) $datos['titulo']));

        $id = Database::transaccion(function () use ($datos, $items): int {
            $id = Database::insertar('servicios', $datos);
            $this->reemplazarItems($id, $items);

            return $id;
        });

        Response::ok($this->conRelaciones($this->obtener($id)), 201);
    }

    public function actualizar(Request $peticion): void
    {
        $id       = $peticion->parametroEntero('id');
        $servicio = $this->obtener($id);
        $datos    = $this->validar($peticion, false);

        if (isset($datos['slug']) && $datos['slug'] !== $servicio['slug']) {
            $datos['slug'] = $this->slugUnico((string) $datos['slug'], $id);
        }

        $items = $this->itemsDeEntrada($peticion);

        Database::transaccion(function () use ($id, $datos, $items, $peticion): void {
            if ($datos !== []) {
                Database::actualizar('servicios', $id, $datos);
            }
            if (array_key_exists('items', $peticion->cuerpo())) {
                $this->reemplazarItems($id, $items);
            }
        });

        Response::ok($this->conRelaciones($this->obtener($id)));
    }

    public function eliminar(Request $peticion): void
    {
        $id = $peticion->parametroEntero('id');
        $this->obtener($id);

        Database::ejecutar('DELETE FROM servicios WHERE id = :id', ['id' => $id]);

        Response::ok(['mensaje' => 'Servicio eliminado.']);
    }

    /** Reordena en bloque: recibe { "orden": [3, 1, 2] } con los ids. */
    public function reordenar(Request $peticion): void
    {
        $ids = $peticion->entrada('orden', []);

        if (!is_array($ids) || $ids === []) {
            throw HttpException::validacion(['orden' => 'Envie el arreglo de identificadores.']);
        }

        Database::transaccion(static function () use ($ids): void {
            foreach (array_values($ids) as $posicion => $id) {
                Database::ejecutar(
                    'UPDATE servicios SET orden = :orden WHERE id = :id',
                    ['orden' => $posicion, 'id' => (int) $id]
                );
            }
        });

        Response::ok(['mensaje' => 'Orden actualizado.']);
    }

    // -----------------------------------------------------------------------

    /** @return array<string,mixed> */
    private function obtener(int $id): array
    {
        $fila = Database::uno('SELECT * FROM servicios WHERE id = :id', ['id' => $id]);

        if ($fila === null) {
            throw HttpException::noEncontrado('El servicio solicitado no existe.');
        }

        return $fila;
    }

    /**
     * @param  array<string,mixed> $servicio
     * @return array<string,mixed>
     */
    private function conRelaciones(array $servicio): array
    {
        $servicio['imagen'] = MediaRepo::buscar((int) ($servicio['imagen_id'] ?? 0));
        $servicio['items']  = array_column(
            Database::todos(
                'SELECT texto FROM servicio_items WHERE servicio_id = :id ORDER BY orden ASC, id ASC',
                ['id' => (int) $servicio['id']]
            ),
            'texto'
        );

        return $servicio;
    }

    /**
     * @return array<string,mixed>
     */
    private function validar(Request $peticion, bool $creando): array
    {
        $validador = Validator::para($peticion->cuerpo());

        $validador->campo('titulo', ($creando ? 'requerido|' : '') . 'texto|max:180');
        $validador->campo('slug', 'texto|slug|max:160');
        $validador->campo('categoria', 'texto|max:80', $creando ? 'general' : null);
        $validador->campo('resumen', 'texto|max:400', $creando ? '' : null);
        $validador->campo('descripcion', 'html');
        $validador->campo('icono', 'texto|max:60', $creando ? 'shield' : null);
        $validador->campo('imagen_id', 'entero');
        $validador->campo('destacado', 'booleano', $creando ? 0 : null);
        $validador->campo('orden', 'entero', $creando ? 0 : null);
        $validador->campo('activo', 'booleano', $creando ? 1 : null);
        $validador->campo('meta_titulo', 'texto|max:180', $creando ? '' : null);
        $validador->campo('meta_descripcion', 'texto|max:300', $creando ? '' : null);

        $datos = $validador->validar();

        // `items` se guarda en su propia tabla.
        unset($datos['items']);

        if ($creando && !isset($datos['slug'])) {
            $datos['slug'] = Validator::slug((string) $datos['titulo']);
        }

        return array_filter($datos, static fn ($v): bool => $v !== null);
    }

    /** @return array<int,string> */
    private function itemsDeEntrada(Request $peticion): array
    {
        $items = $peticion->entrada('items', []);

        if (!is_array($items)) {
            return [];
        }

        $limpios = [];
        foreach ($items as $texto) {
            $texto = trim((string) $texto);
            if ($texto !== '') {
                $limpios[] = mb_substr($texto, 0, 255);
            }
        }

        return $limpios;
    }

    /** @param array<int,string> $items */
    private function reemplazarItems(int $servicioId, array $items): void
    {
        Database::ejecutar('DELETE FROM servicio_items WHERE servicio_id = :id', ['id' => $servicioId]);

        foreach ($items as $posicion => $texto) {
            Database::insertar('servicio_items', [
                'servicio_id' => $servicioId,
                'texto'       => $texto,
                'orden'       => $posicion,
            ]);
        }
    }

    private function slugUnico(string $base, ?int $excluirId = null): string
    {
        $base = $base !== '' ? $base : 'servicio';
        $slug = $base;
        $n    = 2;

        while (true) {
            $sql = 'SELECT COUNT(*) FROM servicios WHERE slug = :slug'
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
