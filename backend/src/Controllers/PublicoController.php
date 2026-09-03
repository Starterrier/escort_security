<?php

declare(strict_types=1);

namespace Ess\Controllers;

use Ess\Core\Database;
use Ess\Core\HttpException;
use Ess\Core\Request;
use Ess\Core\Response;
use Ess\Repositories\AjusteRepo;
use Ess\Repositories\MediaRepo;

/**
 * Endpoints de solo lectura que alimentan el sitio publico.
 */
final class PublicoController
{
    /**
     * Todo lo que la portada necesita en una sola llamada: ajustes, carrusel,
     * servicios y sectores activos.
     */
    public function bootstrap(Request $peticion): void
    {
        Response::ok([
            'ajustes'   => AjusteRepo::paraSitio(),
            'slides'    => $this->slidesActivos(),
            'servicios' => $this->serviciosActivos(),
            'sectores'  => $this->sectoresActivos(),
            'menu'      => $this->menu(),
        ]);
    }

    public function ajustes(Request $peticion): void
    {
        Response::ok(AjusteRepo::paraSitio());
    }

    public function servicios(Request $peticion): void
    {
        Response::ok($this->serviciosActivos());
    }

    public function servicio(Request $peticion): void
    {
        $slug = $peticion->parametro('slug');

        $servicio = Database::uno(
            'SELECT * FROM servicios WHERE slug = :slug AND activo = 1',
            ['slug' => $slug]
        );

        if ($servicio === null) {
            throw HttpException::noEncontrado('El servicio solicitado no existe.');
        }

        $servicio['imagen'] = MediaRepo::buscar((int) $servicio['imagen_id']);
        $servicio['items']  = array_column(
            Database::todos(
                'SELECT texto FROM servicio_items WHERE servicio_id = :id ORDER BY orden ASC, id ASC',
                ['id' => (int) $servicio['id']]
            ),
            'texto'
        );

        // Otros servicios de la misma categoria, para el bloque "tambien le interesa".
        $relacionados = Database::todos(
            'SELECT id, slug, titulo, resumen, icono, imagen_id
             FROM servicios
             WHERE activo = 1 AND id <> :id AND categoria = :categoria
             ORDER BY orden ASC LIMIT 3',
            ['id' => (int) $servicio['id'], 'categoria' => $servicio['categoria']]
        );

        Response::ok([
            'servicio'     => $servicio,
            'relacionados' => MediaRepo::adjuntar($relacionados),
        ]);
    }

    public function sectores(Request $peticion): void
    {
        Response::ok($this->sectoresActivos());
    }

    public function pagina(Request $peticion): void
    {
        $pagina = Database::uno(
            'SELECT * FROM paginas WHERE slug = :slug AND activo = 1',
            ['slug' => $peticion->parametro('slug')]
        );

        if ($pagina === null) {
            throw HttpException::noEncontrado('La pagina solicitada no existe.');
        }

        $pagina['imagen'] = MediaRepo::buscar((int) $pagina['imagen_id']);

        Response::ok($pagina);
    }

    // -----------------------------------------------------------------------

    /** @return array<int,array<string,mixed>> */
    private function serviciosActivos(): array
    {
        $filas = Database::todos(
            'SELECT id, slug, titulo, categoria, resumen, icono, imagen_id, destacado, orden
             FROM servicios WHERE activo = 1 ORDER BY orden ASC, titulo ASC'
        );

        $filas = MediaRepo::adjuntar($filas);

        // Adjunta las vinetas de todos los servicios en una sola consulta.
        $items = Database::todos(
            'SELECT si.servicio_id, si.texto
             FROM servicio_items si
             INNER JOIN servicios s ON s.id = si.servicio_id AND s.activo = 1
             ORDER BY si.orden ASC, si.id ASC'
        );

        $porServicio = [];
        foreach ($items as $item) {
            $porServicio[(int) $item['servicio_id']][] = (string) $item['texto'];
        }

        foreach ($filas as $indice => $fila) {
            $filas[$indice]['items']     = $porServicio[(int) $fila['id']] ?? [];
            $filas[$indice]['destacado'] = (int) $fila['destacado'] === 1;
        }

        return $filas;
    }

    /** @return array<int,array<string,mixed>> */
    private function sectoresActivos(): array
    {
        return MediaRepo::adjuntar(Database::todos(
            'SELECT id, slug, nombre, descripcion, icono, imagen_id
             FROM sectores WHERE activo = 1 ORDER BY orden ASC, nombre ASC'
        ));
    }

    /** @return array<int,array<string,mixed>> */
    private function slidesActivos(): array
    {
        return MediaRepo::adjuntar(Database::todos(
            'SELECT id, titulo, subtitulo, texto, cta_texto, cta_url, imagen_id
             FROM slides WHERE activo = 1 ORDER BY orden ASC, id ASC'
        ));
    }

    /**
     * Enlaces del menu: los fijos del sitio mas las paginas publicadas.
     *
     * @return array<int,array<string,string>>
     */
    private function menu(): array
    {
        $menu = [
            ['etiqueta' => 'Inicio', 'ruta' => '/'],
            ['etiqueta' => 'Nosotros', 'ruta' => '/nosotros'],
            ['etiqueta' => 'Servicios', 'ruta' => '/servicios'],
            ['etiqueta' => 'Sectores', 'ruta' => '/sectores'],
        ];

        // Solo las paginas que el administrador marco para el menu.
        foreach (Database::todos(
            "SELECT slug, titulo FROM paginas
             WHERE activo = 1 AND en_menu = 1 AND slug <> 'nosotros'
             ORDER BY orden ASC, titulo ASC"
        ) as $pagina) {
            $menu[] = [
                'etiqueta' => (string) $pagina['titulo'],
                'ruta'     => '/pagina/' . $pagina['slug'],
            ];
        }

        $menu[] = ['etiqueta' => 'Contacto', 'ruta' => '/contacto'];

        return $menu;
    }
}
