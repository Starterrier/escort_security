<?php

declare(strict_types=1);

namespace Ess\Repositories;

use Ess\Core\Database;

/**
 * Ajustes del sitio: identidad, colores, contacto, redes y SEO.
 *
 * Todo lo que el administrador puede cambiar sin tocar codigo vive aqui.
 */
final class AjusteRepo
{
    /**
     * Definicion de los ajustes conocidos: grupo, tipo y valor inicial.
     * El panel construye su formulario a partir de este mapa.
     *
     * @return array<string,array{grupo:string,tipo:string,etiqueta:string,valor:string,ayuda?:string}>
     */
    public static function definicion(): array
    {
        return [
            // --- Identidad ---------------------------------------------------
            'sitio_nombre'      => ['grupo' => 'identidad', 'tipo' => 'texto', 'etiqueta' => 'Nombre del sitio', 'valor' => 'Escort Security Services'],
            'sitio_razon_social' => ['grupo' => 'identidad', 'tipo' => 'texto', 'etiqueta' => 'Razon social', 'valor' => 'Escort Security Services Ltda.'],
            'sitio_eslogan'     => ['grupo' => 'identidad', 'tipo' => 'texto', 'etiqueta' => 'Eslogan', 'valor' => 'Profesionales al servicio de su tranquilidad'],
            'sitio_logo'        => ['grupo' => 'identidad', 'tipo' => 'media', 'etiqueta' => 'Logo principal', 'valor' => ''],
            'sitio_logo_claro'  => ['grupo' => 'identidad', 'tipo' => 'media', 'etiqueta' => 'Logo para fondo claro', 'valor' => ''],
            'sitio_favicon'     => ['grupo' => 'identidad', 'tipo' => 'media', 'etiqueta' => 'Favicon', 'valor' => ''],
            'sitio_licencia'    => ['grupo' => 'identidad', 'tipo' => 'texto', 'etiqueta' => 'Licencia Supervigilancia', 'valor' => 'Vigilado Supervigilancia - Resolucion 20213900007 del 28 de febrero de 2021'],
            'sitio_nit'         => ['grupo' => 'identidad', 'tipo' => 'texto', 'etiqueta' => 'NIT', 'valor' => ''],

            // --- Apariencia --------------------------------------------------
            'color_primario'    => ['grupo' => 'apariencia', 'tipo' => 'color', 'etiqueta' => 'Color primario', 'valor' => '#0b1e3c', 'ayuda' => 'Azul institucional de fondos y encabezados.'],
            'color_secundario'  => ['grupo' => 'apariencia', 'tipo' => 'color', 'etiqueta' => 'Color secundario', 'valor' => '#3d8fd8', 'ayuda' => 'Azul de acento para botones y titulos resaltados.'],
            'color_acento'      => ['grupo' => 'apariencia', 'tipo' => 'color', 'etiqueta' => 'Color de acento', 'valor' => '#63b3ed'],
            'color_texto'       => ['grupo' => 'apariencia', 'tipo' => 'color', 'etiqueta' => 'Color de texto', 'valor' => '#0f172a'],
            'color_fondo'       => ['grupo' => 'apariencia', 'tipo' => 'color', 'etiqueta' => 'Color de fondo', 'valor' => '#ffffff'],
            'color_fondo_alt'   => ['grupo' => 'apariencia', 'tipo' => 'color', 'etiqueta' => 'Fondo alterno', 'valor' => '#f1f5f9'],
            'tipografia'        => ['grupo' => 'apariencia', 'tipo' => 'texto', 'etiqueta' => 'Tipografia', 'valor' => 'Barlow', 'ayuda' => 'Nombre de una fuente de Google Fonts.'],
            'radio_bordes'      => ['grupo' => 'apariencia', 'tipo' => 'texto', 'etiqueta' => 'Radio de bordes', 'valor' => '14px'],

            // --- Contacto ----------------------------------------------------
            'contacto_telefono' => ['grupo' => 'contacto', 'tipo' => 'texto', 'etiqueta' => 'Telefono fijo', 'valor' => '601 749 5172'],
            'contacto_whatsapp' => ['grupo' => 'contacto', 'tipo' => 'texto', 'etiqueta' => 'WhatsApp', 'valor' => '573124731224', 'ayuda' => 'Solo digitos, con indicativo del pais.'],
            'contacto_email'    => ['grupo' => 'contacto', 'tipo' => 'texto', 'etiqueta' => 'Correo comercial', 'valor' => 'comercial@essltda.com'],
            'contacto_direccion' => ['grupo' => 'contacto', 'tipo' => 'texto', 'etiqueta' => 'Direccion', 'valor' => 'Calle 57 # 24-22'],
            'contacto_ciudad'   => ['grupo' => 'contacto', 'tipo' => 'texto', 'etiqueta' => 'Ciudad', 'valor' => 'Bogota D.C., Colombia'],
            'contacto_horario'  => ['grupo' => 'contacto', 'tipo' => 'texto', 'etiqueta' => 'Horario de atencion', 'valor' => 'Lunes a viernes, 9:00 a.m. - 6:00 p.m.'],
            'contacto_mapa'     => ['grupo' => 'contacto', 'tipo' => 'texto', 'etiqueta' => 'URL del mapa', 'valor' => 'https://maps.google.com/?q=Calle+57+24-22+Bogota'],

            // --- Redes sociales ----------------------------------------------
            'red_facebook'      => ['grupo' => 'redes', 'tipo' => 'texto', 'etiqueta' => 'Facebook', 'valor' => ''],
            'red_instagram'     => ['grupo' => 'redes', 'tipo' => 'texto', 'etiqueta' => 'Instagram', 'valor' => ''],
            'red_linkedin'      => ['grupo' => 'redes', 'tipo' => 'texto', 'etiqueta' => 'LinkedIn', 'valor' => ''],
            'red_youtube'       => ['grupo' => 'redes', 'tipo' => 'texto', 'etiqueta' => 'YouTube', 'valor' => ''],

            // --- Inicio ------------------------------------------------------
            'home_intro_titulo' => ['grupo' => 'inicio', 'tipo' => 'texto', 'etiqueta' => 'Titulo de la introduccion', 'valor' => 'Su operacion en manos profesionales'],
            'home_intro_texto'  => ['grupo' => 'inicio', 'tipo' => 'texto', 'etiqueta' => 'Texto de la introduccion', 'valor' => 'Contamos con infraestructura propia, personal capacitado y certificado, y escuela de capacitacion aprobada por la Supervigilancia. Eso garantiza alta eficacia en la gestion y el manejo del riesgo de su empresa.'],
            'home_cifras'       => ['grupo' => 'inicio', 'tipo' => 'json', 'etiqueta' => 'Cifras destacadas', 'valor' => '[{"valor":"+15","etiqueta":"Anos de experiencia"},{"valor":"24/7","etiqueta":"Monitoreo permanente"},{"valor":"10","etiqueta":"Sectores atendidos"},{"valor":"100%","etiqueta":"Personal certificado"}]'],
            'home_cta_titulo'   => ['grupo' => 'inicio', 'tipo' => 'texto', 'etiqueta' => 'Titulo del llamado final', 'valor' => 'Hablemos de la seguridad de su operacion'],
            'home_cta_texto'    => ['grupo' => 'inicio', 'tipo' => 'texto', 'etiqueta' => 'Texto del llamado final', 'valor' => 'Un asesor evalua su necesidad y le presenta un esquema de proteccion a la medida.'],
            'portafolio_url'    => ['grupo' => 'inicio', 'tipo' => 'texto', 'etiqueta' => 'URL del portafolio PDF', 'valor' => ''],

            // --- SEO ---------------------------------------------------------
            'seo_titulo'        => ['grupo' => 'seo', 'tipo' => 'texto', 'etiqueta' => 'Titulo por defecto', 'valor' => 'Escort Security Services | Vigilancia y seguridad privada'],
            'seo_descripcion'   => ['grupo' => 'seo', 'tipo' => 'texto', 'etiqueta' => 'Descripcion por defecto', 'valor' => 'Empresa de vigilancia y seguridad privada en Colombia: vigilancia fija y movil, escoltas, estudios de seguridad, poligrafia e inteligencia corporativa.'],
            'seo_imagen'        => ['grupo' => 'seo', 'tipo' => 'media', 'etiqueta' => 'Imagen para redes', 'valor' => ''],
            'seo_analytics'     => ['grupo' => 'seo', 'tipo' => 'texto', 'etiqueta' => 'ID de Google Analytics', 'valor' => ''],
        ];
    }

    /**
     * Todos los ajustes como mapa clave => valor (JSON ya decodificado).
     *
     * @return array<string,mixed>
     */
    public static function todos(): array
    {
        $definicion = self::definicion();
        $valores    = [];

        foreach ($definicion as $clave => $meta) {
            $valores[$clave] = $meta['tipo'] === 'json'
                ? json_decode($meta['valor'], true)
                : $meta['valor'];
        }

        foreach (Database::todos('SELECT clave, valor, tipo FROM ajustes') as $fila) {
            $clave = (string) $fila['clave'];
            $valor = $fila['valor'];

            if (($fila['tipo'] ?? '') === 'json') {
                $decodificado    = json_decode((string) $valor, true);
                $valores[$clave] = $decodificado === null ? [] : $decodificado;
            } else {
                $valores[$clave] = (string) $valor;
            }
        }

        return $valores;
    }

    /**
     * Ajustes agrupados y anotados, para pintar el formulario del panel.
     *
     * @return array<string,array<int,array<string,mixed>>>
     */
    public static function porGrupo(): array
    {
        $valores  = self::todos();
        $agrupado = [];

        foreach (self::definicion() as $clave => $meta) {
            $agrupado[$meta['grupo']][] = [
                'clave'    => $clave,
                'etiqueta' => $meta['etiqueta'],
                'tipo'     => $meta['tipo'],
                'ayuda'    => $meta['ayuda'] ?? '',
                'valor'    => $valores[$clave] ?? '',
            ];
        }

        return $agrupado;
    }

    /**
     * Guarda solo las claves reconocidas.
     *
     * @param  array<string,mixed> $entrada
     * @return array<string,mixed> Ajustes resultantes.
     */
    public static function guardar(array $entrada): array
    {
        $definicion = self::definicion();

        foreach ($entrada as $clave => $valor) {
            if (!isset($definicion[$clave])) {
                continue; // Se ignoran claves desconocidas.
            }

            $tipo = $definicion[$clave]['tipo'];

            if ($tipo === 'json') {
                $texto = is_string($valor) ? $valor : (string) json_encode($valor, JSON_UNESCAPED_UNICODE);
            } else {
                $texto = is_scalar($valor) ? trim((string) $valor) : '';
            }

            Database::ejecutar(
                'INSERT INTO ajustes (clave, grupo, valor, tipo) VALUES (:clave, :grupo, :valor, :tipo)
                 ON DUPLICATE KEY UPDATE valor = VALUES(valor), grupo = VALUES(grupo), tipo = VALUES(tipo)',
                [
                    'clave' => $clave,
                    'grupo' => $definicion[$clave]['grupo'],
                    'valor' => $texto,
                    'tipo'  => $tipo,
                ]
            );
        }

        return self::todos();
    }

    /**
     * Ajustes listos para el sitio publico: los de tipo `media` se resuelven
     * a su URL y se anaden datos derivados.
     *
     * @return array<string,mixed>
     */
    public static function paraSitio(): array
    {
        $valores    = self::todos();
        $definicion = self::definicion();

        foreach ($definicion as $clave => $meta) {
            if ($meta['tipo'] !== 'media') {
                continue;
            }
            $medio           = MediaRepo::buscar((int) ($valores[$clave] ?? 0));
            $valores[$clave] = $medio['url'] ?? '';
        }

        $whatsapp = preg_replace('/\D+/', '', (string) ($valores['contacto_whatsapp'] ?? ''));
        $valores['whatsapp_url'] = $whatsapp !== '' ? 'https://wa.me/' . $whatsapp : '';
        $valores['telefono_url'] = 'tel:' . preg_replace('/\s+/', '', (string) ($valores['contacto_telefono'] ?? ''));

        return $valores;
    }
}
