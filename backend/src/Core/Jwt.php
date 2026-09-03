<?php

declare(strict_types=1);

namespace Ess\Core;

/**
 * Implementacion minima de JWT HS256 sin dependencias externas.
 */
final class Jwt
{
    /** @param array<string,mixed> $carga */
    public static function firmar(array $carga): string
    {
        $ahora   = time();
        $minutos = (int) Config::get('jwt.minutos_vigencia', 480);

        $carga = array_merge([
            'iss' => (string) Config::get('jwt.emisor', 'essltda.com'),
            'iat' => $ahora,
            'nbf' => $ahora,
            'exp' => $ahora + ($minutos * 60),
        ], $carga);

        $cabecera = self::base64UrlEncode((string) json_encode(['alg' => 'HS256', 'typ' => 'JWT']));
        $cuerpo   = self::base64UrlEncode((string) json_encode($carga, JSON_UNESCAPED_UNICODE));
        $firma    = self::base64UrlEncode(self::hmac($cabecera . '.' . $cuerpo));

        return $cabecera . '.' . $cuerpo . '.' . $firma;
    }

    /**
     * Verifica firma y vigencia.
     *
     * @return array<string,mixed>|null Carga util o null si el token no es valido.
     */
    public static function verificar(string $token): ?array
    {
        $partes = explode('.', $token);

        if (count($partes) !== 3) {
            return null;
        }

        [$cabecera, $cuerpo, $firma] = $partes;

        $esperada = self::base64UrlEncode(self::hmac($cabecera . '.' . $cuerpo));
        if (!hash_equals($esperada, $firma)) {
            return null;
        }

        $datosCabecera = json_decode(self::base64UrlDecode($cabecera), true);
        if (!is_array($datosCabecera) || ($datosCabecera['alg'] ?? '') !== 'HS256') {
            return null;
        }

        $carga = json_decode(self::base64UrlDecode($cuerpo), true);
        if (!is_array($carga)) {
            return null;
        }

        $ahora = time();
        if (isset($carga['exp']) && $ahora >= (int) $carga['exp']) {
            return null;
        }
        if (isset($carga['nbf']) && $ahora < (int) $carga['nbf']) {
            return null;
        }

        return $carga;
    }

    public static function expiracion(string $token): ?int
    {
        $carga = self::verificar($token);

        return $carga === null ? null : (int) ($carga['exp'] ?? 0);
    }

    private static function hmac(string $mensaje): string
    {
        return hash_hmac('sha256', $mensaje, (string) Config::get('jwt.secreto', ''), true);
    }

    private static function base64UrlEncode(string $dato): string
    {
        return rtrim(strtr(base64_encode($dato), '+/', '-_'), '=');
    }

    private static function base64UrlDecode(string $dato): string
    {
        $relleno = strlen($dato) % 4;
        if ($relleno > 0) {
            $dato .= str_repeat('=', 4 - $relleno);
        }

        return (string) base64_decode(strtr($dato, '-_', '+/'), true);
    }
}
