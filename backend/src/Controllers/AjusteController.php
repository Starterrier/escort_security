<?php

declare(strict_types=1);

namespace Ess\Controllers;

use Ess\Core\HttpException;
use Ess\Core\Request;
use Ess\Core\Response;
use Ess\Repositories\AjusteRepo;

/**
 * Ajustes del sitio: identidad, apariencia, contacto, redes, inicio y SEO.
 */
final class AjusteController
{
    /** Devuelve los ajustes agrupados y anotados para el formulario del panel. */
    public function listar(Request $peticion): void
    {
        Response::ok([
            'grupos'  => AjusteRepo::porGrupo(),
            'valores' => AjusteRepo::todos(),
        ]);
    }

    public function guardar(Request $peticion): void
    {
        $entrada = $peticion->entrada('ajustes');

        if (!is_array($entrada) || $entrada === []) {
            throw HttpException::validacion(['ajustes' => 'Envie un objeto con los ajustes a guardar.']);
        }

        $definicion = AjusteRepo::definicion();
        $errores    = [];

        foreach ($entrada as $clave => $valor) {
            if (!isset($definicion[$clave])) {
                continue;
            }

            if ($definicion[$clave]['tipo'] === 'color'
                && is_string($valor) && $valor !== ''
                && preg_match('/^#([0-9a-f]{3}|[0-9a-f]{6})$/i', $valor) !== 1
            ) {
                $errores[$clave] = 'Use un color hexadecimal, por ejemplo #1B4F91.';
            }

            if ($definicion[$clave]['tipo'] === 'json' && is_string($valor) && $valor !== ''
                && json_decode($valor) === null && json_last_error() !== JSON_ERROR_NONE
            ) {
                $errores[$clave] = 'El contenido no es un JSON valido.';
            }
        }

        if ($errores !== []) {
            throw HttpException::validacion($errores);
        }

        Response::ok([
            'grupos'  => AjusteRepo::porGrupo(),
            'valores' => AjusteRepo::guardar($entrada),
        ]);
    }
}
