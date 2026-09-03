<?php

declare(strict_types=1);

namespace Ess\Controllers;

use Ess\Core\Config;
use Ess\Core\Database;
use Ess\Core\HttpException;
use Ess\Core\Logger;
use Ess\Core\Request;
use Ess\Core\Response;
use Ess\Core\Validator;
use Ess\Repositories\MediaRepo;

/**
 * Biblioteca de medios: subida, listado, edicion del texto alternativo y borrado.
 */
final class MediaController
{
    public function listar(Request $peticion): void
    {
        $pagina    = max(1, $peticion->consultaEntero('pagina', 1));
        $porPagina = min(100, max(1, $peticion->consultaEntero('por_pagina', 30)));
        $desfase   = ($pagina - 1) * $porPagina;

        $condicion  = '';
        $parametros = [];

        $busqueda = $peticion->consulta('q');
        if ($busqueda !== null) {
            $condicion        = ' WHERE nombre_original LIKE :q0 OR alt LIKE :q1';
            $parametros['q0'] = '%' . $busqueda . '%';
            $parametros['q1'] = '%' . $busqueda . '%';
        }

        $total = (int) Database::valor('SELECT COUNT(*) FROM media' . $condicion, $parametros);

        // LIMIT/OFFSET no admiten marcadores con prepares reales: van casteados.
        $filas = Database::todos(
            'SELECT * FROM media' . $condicion . ' ORDER BY creado_en DESC, id DESC'
            . ' LIMIT ' . $porPagina . ' OFFSET ' . $desfase,
            $parametros
        );

        Response::paginado(array_map([MediaRepo::class, 'formatear'], $filas), $total, $pagina, $porPagina);
    }

    public function subir(Request $peticion): void
    {
        if (!isset($_FILES['archivo'])) {
            throw HttpException::validacion(['archivo' => 'No se recibio ningun archivo.']);
        }

        $archivo = $_FILES['archivo'];

        if (is_array($archivo['name'])) {
            throw HttpException::validacion(['archivo' => 'Suba los archivos de uno en uno.']);
        }

        $this->verificarErrorDeSubida((int) $archivo['error']);

        $peso    = (int) $archivo['size'];
        $maximo  = (int) Config::get('uploads.peso_maximo', 5 * 1024 * 1024);

        if ($peso <= 0) {
            throw HttpException::validacion(['archivo' => 'El archivo esta vacio.']);
        }

        if ($peso > $maximo) {
            throw HttpException::validacion([
                'archivo' => 'El archivo supera el maximo de ' . round($maximo / 1048576, 1) . ' MB.',
            ]);
        }

        $temporal = (string) $archivo['tmp_name'];

        if (!is_uploaded_file($temporal)) {
            throw HttpException::validacion(['archivo' => 'La subida no es valida.']);
        }

        // El MIME se deduce del contenido, no del nombre ni de la cabecera.
        $mime = $this->detectarMime($temporal);
        /** @var array<int,string> $permitidos */
        $permitidos = (array) Config::get('uploads.mimes', []);

        if (!in_array($mime, $permitidos, true)) {
            throw HttpException::validacion([
                'archivo' => 'Tipo de archivo no permitido (' . $mime . '). Use JPG, PNG, WEBP, AVIF o PDF.',
            ]);
        }

        $directorio = (string) Config::get('uploads.directorio', '');
        if (!is_dir($directorio) && !@mkdir($directorio, 0775, true) && !is_dir($directorio)) {
            throw new HttpException('No se pudo crear la carpeta de subidas.', 500);
        }

        $nombreOriginal = (string) $archivo['name'];
        $nombreFisico   = $this->nombreSeguro($nombreOriginal, $mime);
        $destino        = rtrim($directorio, '/\\') . DIRECTORY_SEPARATOR . $nombreFisico;

        if (!move_uploaded_file($temporal, $destino)) {
            throw new HttpException('No se pudo guardar el archivo en el servidor.', 500);
        }

        @chmod($destino, 0644);

        $ancho = null;
        $alto  = null;
        if (strpos($mime, 'image/') === 0) {
            $medidas = @getimagesize($destino);
            if (is_array($medidas)) {
                $ancho = (int) $medidas[0];
                $alto  = (int) $medidas[1];
            }
        }

        $alt = trim((string) ($peticion->entrada('alt', '') ?? ''));

        $id = Database::insertar('media', [
            'archivo'         => $nombreFisico,
            'ruta'            => MediaRepo::urlBase() . '/' . $nombreFisico,
            'nombre_original' => mb_substr($nombreOriginal, 0, 255),
            'mime'            => $mime,
            'peso'            => $peso,
            'ancho'           => $ancho,
            'alto'            => $alto,
            'alt'             => mb_substr($alt, 0, 255),
            'subido_por'      => $peticion->usuarioId() ?: null,
        ]);

        MediaRepo::invalidarCache();

        Response::ok(MediaRepo::buscar($id), 201);
    }

    public function actualizar(Request $peticion): void
    {
        $id = $peticion->parametroEntero('id');
        $this->obtener($id);

        $datos = Validator::para($peticion->cuerpo())
            ->campo('alt', 'texto|max:255', '')
            ->validar();

        Database::actualizar('media', $id, ['alt' => (string) $datos['alt']]);
        MediaRepo::invalidarCache();

        Response::ok(MediaRepo::buscar($id));
    }

    public function eliminar(Request $peticion): void
    {
        $id     = $peticion->parametroEntero('id');
        $medio  = $this->obtener($id);
        $enUso  = $this->contarUsos($id);

        if ($enUso > 0 && $peticion->consultaBool('forzar') !== true) {
            throw HttpException::conflicto(
                'La imagen se esta usando en ' . $enUso . ' registro(s). '
                . 'Quitela de ahi primero o repita la peticion con ?forzar=1.'
            );
        }

        Database::ejecutar('DELETE FROM media WHERE id = :id', ['id' => $id]);

        $ruta = rtrim((string) Config::get('uploads.directorio', ''), '/\\')
            . DIRECTORY_SEPARATOR . $medio['archivo'];

        // El registro ya se borro; si el archivo no se puede eliminar (permisos
        // o bloqueo del sistema de archivos) queda constancia en el log en vez
        // de convertirse en un huerfano silencioso.
        if (is_file($ruta) && !@unlink($ruta)) {
            Logger::error('No se pudo eliminar el archivo subido: ' . $ruta);
        }

        MediaRepo::invalidarCache();

        Response::ok(['mensaje' => 'Archivo eliminado.']);
    }

    // -----------------------------------------------------------------------

    /** @return array<string,mixed> */
    private function obtener(int $id): array
    {
        $fila = Database::uno('SELECT * FROM media WHERE id = :id', ['id' => $id]);

        if ($fila === null) {
            throw HttpException::noEncontrado('El archivo no existe.');
        }

        return $fila;
    }

    private function contarUsos(int $id): int
    {
        $total = 0;

        foreach (['servicios', 'sectores', 'slides', 'paginas'] as $tabla) {
            $total += (int) Database::valor(
                'SELECT COUNT(*) FROM ' . $tabla . ' WHERE imagen_id = :id',
                ['id' => $id]
            );
        }

        $total += (int) Database::valor(
            "SELECT COUNT(*) FROM ajustes WHERE tipo = 'media' AND valor = :id",
            ['id' => (string) $id]
        );

        return $total;
    }

    private function detectarMime(string $ruta): string
    {
        if (function_exists('finfo_open')) {
            $finfo = finfo_open(FILEINFO_MIME_TYPE);
            if ($finfo !== false) {
                $mime = finfo_file($finfo, $ruta);
                finfo_close($finfo);
                if (is_string($mime) && $mime !== '') {
                    return $mime;
                }
            }
        }

        $medidas = @getimagesize($ruta);

        return is_array($medidas) && isset($medidas['mime'])
            ? (string) $medidas['mime']
            : 'application/octet-stream';
    }

    private function nombreSeguro(string $nombreOriginal, string $mime): string
    {
        $extensiones = [
            'image/jpeg'      => 'jpg',
            'image/png'       => 'png',
            'image/webp'      => 'webp',
            'image/avif'      => 'avif',
            'application/pdf' => 'pdf',
        ];

        $extension = $extensiones[$mime] ?? 'bin';
        $base      = Validator::slug(pathinfo($nombreOriginal, PATHINFO_FILENAME));
        $base      = $base !== '' ? mb_substr($base, 0, 60) : 'archivo';

        return $base . '-' . date('Ymd') . '-' . bin2hex(random_bytes(4)) . '.' . $extension;
    }

    private function verificarErrorDeSubida(int $codigo): void
    {
        if ($codigo === UPLOAD_ERR_OK) {
            return;
        }

        $mensajes = [
            UPLOAD_ERR_INI_SIZE   => 'El archivo supera el limite del servidor (upload_max_filesize).',
            UPLOAD_ERR_FORM_SIZE  => 'El archivo supera el limite del formulario.',
            UPLOAD_ERR_PARTIAL    => 'La subida quedo incompleta. Intentelo de nuevo.',
            UPLOAD_ERR_NO_FILE    => 'No se selecciono ningun archivo.',
            UPLOAD_ERR_NO_TMP_DIR => 'Falta la carpeta temporal en el servidor.',
            UPLOAD_ERR_CANT_WRITE => 'El servidor no pudo escribir el archivo en disco.',
            UPLOAD_ERR_EXTENSION  => 'Una extension de PHP detuvo la subida.',
        ];

        throw HttpException::validacion([
            'archivo' => $mensajes[$codigo] ?? 'No se pudo subir el archivo.',
        ]);
    }
}
