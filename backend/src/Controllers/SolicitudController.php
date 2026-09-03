<?php

declare(strict_types=1);

namespace Ess\Controllers;

use Ess\Core\Config;
use Ess\Core\Database;
use Ess\Core\HttpException;
use Ess\Core\Mailer;
use Ess\Core\Request;
use Ess\Core\Response;
use Ess\Core\Validator;

/**
 * Formulario publico de contacto y su bandeja en el panel.
 */
final class SolicitudController
{
    private const ESTADOS = ['nueva', 'en_gestion', 'atendida', 'descartada'];

    /** Endpoint publico: recibe la solicitud del sitio. */
    public function recibir(Request $peticion): void
    {
        // Trampa para robots: campo oculto que un humano nunca completa.
        $trampa = trim((string) ($peticion->entrada('sitio_web', '') ?? ''));
        if ($trampa !== '') {
            // Se responde como si todo hubiera salido bien para no dar pistas.
            Response::ok(['mensaje' => 'Gracias por escribirnos. Le contactaremos pronto.'], 201);

            return;
        }

        $this->verificarLimite($peticion->ip());

        $datos = Validator::para($peticion->cuerpo())
            ->campo('nombre', 'requerido|texto|min:3|max:150')
            ->campo('email', 'requerido|texto|email|max:190')
            ->campo('telefono', 'texto|max:40', '')
            ->campo('empresa', 'texto|max:150', '')
            ->campo('ciudad', 'texto|max:100', '')
            ->campo('servicio_id', 'entero', null)
            ->campo('mensaje', 'requerido|texto|min:10|max:2000')
            ->validar();

        $servicioId = isset($datos['servicio_id']) && (int) $datos['servicio_id'] > 0
            ? (int) $datos['servicio_id']
            : null;

        $servicio = null;
        if ($servicioId !== null) {
            $servicio = Database::valor(
                'SELECT titulo FROM servicios WHERE id = :id AND activo = 1',
                ['id' => $servicioId]
            );
            if ($servicio === null) {
                $servicioId = null; // Id inexistente: se guarda la solicitud igual.
            }
        }

        $registro = [
            'nombre'      => (string) $datos['nombre'],
            'email'       => strtolower((string) $datos['email']),
            'telefono'    => (string) $datos['telefono'],
            'empresa'     => (string) $datos['empresa'],
            'ciudad'      => (string) $datos['ciudad'],
            'servicio_id' => $servicioId,
            'mensaje'     => (string) $datos['mensaje'],
            'ip'          => $peticion->ip(),
            'user_agent'  => $peticion->agente(),
        ];

        $id = Database::insertar('solicitudes', $registro);

        $enviado = Mailer::enviar(
            'Nueva solicitud de ' . $registro['nombre'],
            Mailer::plantillaSolicitud($registro, $servicio !== null ? (string) $servicio : null),
            $registro['email']
        );

        Response::ok([
            'id'             => $id,
            'correo_enviado' => $enviado,
            'mensaje'        => 'Gracias por escribirnos. Un asesor le contactara pronto.',
        ], 201);
    }

    /** Bandeja del panel. */
    public function listar(Request $peticion): void
    {
        $pagina    = max(1, $peticion->consultaEntero('pagina', 1));
        $porPagina = min(100, max(1, $peticion->consultaEntero('por_pagina', 20)));
        $desfase   = ($pagina - 1) * $porPagina;

        $condiciones = [];
        $parametros  = [];

        $estado = $peticion->consulta('estado');
        if ($estado !== null && in_array($estado, self::ESTADOS, true)) {
            $condiciones[]        = 's.estado = :estado';
            $parametros['estado'] = $estado;
        }

        $busqueda = $peticion->consulta('q');
        if ($busqueda !== null) {
            $piezas = [];
            foreach (['s.nombre', 's.email', 's.empresa', 's.mensaje'] as $indice => $campo) {
                $piezas[]                  = $campo . ' LIKE :q' . $indice;
                $parametros['q' . $indice] = '%' . $busqueda . '%';
            }
            $condiciones[] = '(' . implode(' OR ', $piezas) . ')';
        }

        $where = $condiciones === [] ? '' : ' WHERE ' . implode(' AND ', $condiciones);

        $total = (int) Database::valor('SELECT COUNT(*) FROM solicitudes s' . $where, $parametros);

        $filas = Database::todos(
            'SELECT s.*, v.titulo AS servicio_titulo
             FROM solicitudes s
             LEFT JOIN servicios v ON v.id = s.servicio_id'
            . $where . ' ORDER BY s.creado_en DESC, s.id DESC'
            . ' LIMIT ' . $porPagina . ' OFFSET ' . $desfase,
            $parametros
        );

        Response::paginado($filas, $total, $pagina, $porPagina);
    }

    public function ver(Request $peticion): void
    {
        Response::ok($this->obtener($peticion->parametroEntero('id')));
    }

    public function actualizar(Request $peticion): void
    {
        $id = $peticion->parametroEntero('id');
        $this->obtener($id);

        $datos = Validator::para($peticion->cuerpo())
            ->campo('estado', 'texto|en:' . implode(',', self::ESTADOS))
            ->campo('notas', 'texto|max:2000')
            ->validar();

        $cambios = array_filter($datos, static fn ($v): bool => $v !== null);

        if ($cambios !== []) {
            Database::actualizar('solicitudes', $id, $cambios);
        }

        Response::ok($this->obtener($id));
    }

    public function eliminar(Request $peticion): void
    {
        $id = $peticion->parametroEntero('id');
        $this->obtener($id);

        Database::ejecutar('DELETE FROM solicitudes WHERE id = :id', ['id' => $id]);

        Response::ok(['mensaje' => 'Solicitud eliminada.']);
    }

    // -----------------------------------------------------------------------

    /** @return array<string,mixed> */
    private function obtener(int $id): array
    {
        $fila = Database::uno(
            'SELECT s.*, v.titulo AS servicio_titulo
             FROM solicitudes s
             LEFT JOIN servicios v ON v.id = s.servicio_id
             WHERE s.id = :id',
            ['id' => $id]
        );

        if ($fila === null) {
            throw HttpException::noEncontrado('La solicitud no existe.');
        }

        return $fila;
    }

    private function verificarLimite(string $ip): void
    {
        $maximo  = (int) Config::get('seguridad.max_solicitudes_ip', 5);
        $minutos = (int) Config::get('seguridad.minutos_ventana_form', 60);

        $recientes = (int) Database::valor(
            'SELECT COUNT(*) FROM solicitudes
             WHERE ip = :ip AND creado_en > DATE_SUB(NOW(), INTERVAL ' . $minutos . ' MINUTE)',
            ['ip' => $ip]
        );

        if ($recientes >= $maximo) {
            throw HttpException::demasiadasPeticiones(
                'Ya recibimos varias solicitudes desde su conexion. '
                . 'Escribanos directamente a ' . Config::get('correo.destinatario', 'nuestro correo') . '.'
            );
        }
    }
}
