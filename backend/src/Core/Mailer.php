<?php

declare(strict_types=1);

namespace Ess\Core;

/**
 * Envio de correo por mail() con cabeceras correctas.
 *
 * Si el hosting exige SMTP autenticado, sustituya `enviar()` por PHPMailer
 * manteniendo la misma firma (ver docs/DESPLIEGUE.md).
 */
final class Mailer
{
    /**
     * Devuelve true si el correo salio; false si no se pudo entregar o el
     * envio esta desactivado por configuracion.
     */
    public static function enviar(string $asunto, string $cuerpoHtml, ?string $responderA = null): bool
    {
        if (Config::get('correo.enviar', false) !== true) {
            return false;
        }

        $destinatario = (string) Config::get('correo.destinatario', '');
        if ($destinatario === '') {
            return false;
        }

        $remitente = (string) Config::get('correo.remitente', 'no-responder@essltda.com');
        $nombre    = (string) Config::get('correo.nombre_remitente', 'Sitio web');

        $cabeceras = [
            'MIME-Version: 1.0',
            'Content-Type: text/html; charset=UTF-8',
            'From: ' . self::codificarNombre($nombre) . ' <' . $remitente . '>',
        ];

        if ($responderA !== null && filter_var($responderA, FILTER_VALIDATE_EMAIL) !== false) {
            $cabeceras[] = 'Reply-To: ' . $responderA;
        }

        try {
            return @mail(
                $destinatario,
                self::codificarNombre($asunto),
                $cuerpoHtml,
                implode("\r\n", $cabeceras),
                '-f' . $remitente
            );
        } catch (\Throwable $e) {
            Logger::error('Fallo el envio de correo: ' . $e->getMessage());

            return false;
        }
    }

    private static function codificarNombre(string $texto): string
    {
        return '=?UTF-8?B?' . base64_encode($texto) . '?=';
    }

    /**
     * Plantilla HTML de la notificacion de una nueva solicitud.
     *
     * @param array<string,mixed> $solicitud
     */
    public static function plantillaSolicitud(array $solicitud, ?string $servicio = null): string
    {
        $fila = static function (string $etiqueta, ?string $valor): string {
            if ($valor === null || trim($valor) === '') {
                return '';
            }

            return '<tr>'
                . '<td style="padding:8px 12px;background:#f1f5f9;font-weight:600;width:170px;">'
                . htmlspecialchars($etiqueta, ENT_QUOTES, 'UTF-8') . '</td>'
                . '<td style="padding:8px 12px;">' . nl2br(htmlspecialchars($valor, ENT_QUOTES, 'UTF-8')) . '</td>'
                . '</tr>';
        };

        return '<!doctype html><html lang="es"><body style="margin:0;background:#f8fafc;'
            . 'font-family:Segoe UI,Arial,sans-serif;color:#0f172a;">'
            . '<div style="max-width:640px;margin:24px auto;background:#ffffff;border-radius:12px;overflow:hidden;'
            . 'box-shadow:0 4px 20px rgba(15,23,42,.08);">'
            . '<div style="background:#0b1e3c;color:#ffffff;padding:20px 24px;">'
            . '<h1 style="margin:0;font-size:18px;">Nueva solicitud desde el sitio web</h1>'
            . '<p style="margin:6px 0 0;font-size:13px;color:#93b8e0;">Escort Security Services</p>'
            . '</div>'
            . '<table style="width:100%;border-collapse:collapse;font-size:14px;">'
            . $fila('Nombre', (string) ($solicitud['nombre'] ?? ''))
            . $fila('Correo', (string) ($solicitud['email'] ?? ''))
            . $fila('Telefono', (string) ($solicitud['telefono'] ?? ''))
            . $fila('Empresa', (string) ($solicitud['empresa'] ?? ''))
            . $fila('Ciudad', (string) ($solicitud['ciudad'] ?? ''))
            . $fila('Servicio', $servicio)
            . $fila('Mensaje', (string) ($solicitud['mensaje'] ?? ''))
            . $fila('Recibida', date('Y-m-d H:i'))
            . '</table>'
            . '<div style="padding:16px 24px;font-size:12px;color:#64748b;background:#f8fafc;">'
            . 'Esta solicitud tambien quedo registrada en el panel administrativo.'
            . '</div></div></body></html>';
    }
}
