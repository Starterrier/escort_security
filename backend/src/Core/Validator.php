<?php

declare(strict_types=1);

namespace Ess\Core;

/**
 * Validacion y saneamiento de los datos de entrada.
 *
 * Reglas soportadas: requerido, texto, entero, booleano, email, url, color,
 * slug, max:N, min:N, en:a,b,c, html.
 */
final class Validator
{
    /** @var array<string,mixed> */
    private array $entrada;
    /** @var array<string,mixed> */
    private array $limpios = [];
    /** @var array<string,string> */
    private array $errores = [];

    /** @param array<string,mixed> $entrada */
    public function __construct(array $entrada)
    {
        $this->entrada = $entrada;
    }

    /** @param array<string,mixed> $entrada */
    public static function para(array $entrada): self
    {
        return new self($entrada);
    }

    /**
     * @param  string $reglas Reglas separadas por barra vertical.
     * @param  mixed  $porDefecto Valor usado cuando el campo no viene.
     */
    public function campo(string $clave, string $reglas, $porDefecto = null): self
    {
        $listaReglas = array_filter(explode('|', $reglas));
        $requerido   = in_array('requerido', $listaReglas, true);
        $presente    = array_key_exists($clave, $this->entrada);
        $valor       = $presente ? $this->entrada[$clave] : $porDefecto;

        if ($requerido && ($valor === null || $valor === '' || (is_string($valor) && trim($valor) === ''))) {
            $this->errores[$clave] = 'Este campo es obligatorio.';

            return $this;
        }

        if (!$presente && $porDefecto === null && !$requerido) {
            return $this; // Campo opcional ausente: no se incluye en los limpios.
        }

        foreach ($listaReglas as $regla) {
            if ($regla === 'requerido') {
                continue;
            }

            [$nombre, $argumento] = array_pad(explode(':', $regla, 2), 2, null);

            switch ($nombre) {
                case 'texto':
                    $valor = is_scalar($valor) ? trim((string) $valor) : '';
                    break;

                case 'html':
                    // Conserva marcado basico pero elimina scripts y atributos de evento.
                    $valor = self::limpiarHtml(is_scalar($valor) ? (string) $valor : '');
                    break;

                case 'entero':
                    if ($valor === null || $valor === '') {
                        $valor = null;
                        break;
                    }
                    if (!is_numeric($valor)) {
                        $this->errores[$clave] = 'Debe ser un numero entero.';
                        break 2;
                    }
                    $valor = (int) $valor;
                    break;

                case 'booleano':
                    $valor = in_array($valor, [true, 1, '1', 'true', 'si', 'on'], true) ? 1 : 0;
                    break;

                case 'email':
                    $valor = trim((string) $valor);
                    if ($valor !== '' && filter_var($valor, FILTER_VALIDATE_EMAIL) === false) {
                        $this->errores[$clave] = 'El correo electronico no es valido.';
                        break 2;
                    }
                    break;

                case 'url':
                    $valor = trim((string) $valor);
                    if ($valor !== '' && !preg_match('#^(https?://|/|\#)#i', $valor)) {
                        $this->errores[$clave] = 'La direccion debe empezar por http://, https://, / o #.';
                        break 2;
                    }
                    break;

                case 'color':
                    $valor = trim((string) $valor);
                    if ($valor !== '' && preg_match('/^#([0-9a-f]{3}|[0-9a-f]{6})$/i', $valor) !== 1) {
                        $this->errores[$clave] = 'Use un color hexadecimal, por ejemplo #1B4F91.';
                        break 2;
                    }
                    $valor = strtolower($valor);
                    break;

                case 'slug':
                    // Vacio es valido: quien llama lo deriva del titulo.
                    $original = trim((string) $valor);
                    $valor    = self::slug($original);
                    if ($original !== '' && $valor === '') {
                        $this->errores[$clave] = 'No se pudo generar una URL valida con ese texto.';
                        break 2;
                    }
                    break;

                case 'max':
                    if (is_string($valor) && mb_strlen($valor) > (int) $argumento) {
                        $this->errores[$clave] = 'No puede superar ' . $argumento . ' caracteres.';
                        break 2;
                    }
                    break;

                case 'min':
                    if (is_string($valor) && mb_strlen($valor) < (int) $argumento) {
                        $this->errores[$clave] = 'Debe tener al menos ' . $argumento . ' caracteres.';
                        break 2;
                    }
                    break;

                case 'en':
                    $opciones = explode(',', (string) $argumento);
                    if (!in_array((string) $valor, $opciones, true)) {
                        $this->errores[$clave] = 'Valor no permitido. Opciones: ' . implode(', ', $opciones) . '.';
                        break 2;
                    }
                    break;
            }
        }

        if (!isset($this->errores[$clave])) {
            $this->limpios[$clave] = $valor;
        }

        return $this;
    }

    public function tieneErrores(): bool
    {
        return $this->errores !== [];
    }

    /**
     * @return array<string,mixed>
     * @throws HttpException
     */
    public function validar(): array
    {
        if ($this->errores !== []) {
            throw HttpException::validacion($this->errores);
        }

        return $this->limpios;
    }

    /** @return array<string,mixed> */
    public function limpios(): array
    {
        return $this->limpios;
    }

    public static function slug(string $texto): string
    {
        $texto = strtr(
            $texto,
            [
                'á' => 'a', 'é' => 'e', 'í' => 'i', 'ó' => 'o', 'ú' => 'u', 'ü' => 'u', 'ñ' => 'n',
                'Á' => 'A', 'É' => 'E', 'Í' => 'I', 'Ó' => 'O', 'Ú' => 'U', 'Ü' => 'U', 'Ñ' => 'N',
            ]
        );
        $texto = strtolower($texto);
        $texto = (string) preg_replace('/[^a-z0-9]+/', '-', $texto);

        return trim($texto, '-');
    }

    /**
     * Elimina etiquetas peligrosas y atributos de evento del HTML enviado
     * desde el editor del panel.
     */
    public static function limpiarHtml(string $html): string
    {
        if ($html === '') {
            return '';
        }

        $html = (string) preg_replace('#<(script|style|iframe|object|embed|form)\b[^>]*>.*?</\1>#is', '', $html);
        $html = (string) preg_replace('#<(script|style|iframe|object|embed|form)\b[^>]*/?>#is', '', $html);
        $html = (string) preg_replace('/\son[a-z]+\s*=\s*("[^"]*"|\'[^\']*\'|[^\s>]+)/i', '', $html);
        $html = (string) preg_replace('/(href|src)\s*=\s*("|\')\s*javascript:[^"\']*\2/i', '$1="#"', $html);

        $permitidas = '<p><br><strong><b><em><i><u><ul><ol><li><h2><h3><h4><h5>'
            . '<blockquote><a><span><img><table><thead><tbody><tr><th><td><hr><figure><figcaption>';

        return trim(strip_tags($html, $permitidas));
    }
}
