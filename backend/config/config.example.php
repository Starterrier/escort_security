<?php
/**
 * Configuracion de la API de ESCORT SECURITY SERVICES.
 *
 * Copie este archivo como `config.php` y ajuste los valores del servidor.
 * `config.php` NO debe versionarse (ver .gitignore).
 */

return [
    // Entorno: 'local' muestra los errores, 'produccion' los oculta y los registra.
    'entorno' => 'local',

    'db' => [
        'host'    => '127.0.0.1',
        'puerto'  => 3306,
        'nombre'  => 'essltda',
        'usuario' => 'root',
        'clave'   => '',
        'charset' => 'utf8mb4',
    ],

    // Clave para firmar los tokens JWT. Cambiela por una cadena aleatoria larga.
    // Puede generar una con: php -r "echo bin2hex(random_bytes(32));"
    'jwt' => [
        'secreto'          => 'CAMBIE-ESTA-CLAVE-POR-UNA-ALEATORIA-DE-64-CARACTERES',
        'emisor'           => 'essltda.com',
        'minutos_vigencia' => 480,
    ],

    // Origenes autorizados para consumir la API desde el navegador.
    'cors' => [
        'origenes' => [
            'http://localhost:4200',
            'http://127.0.0.1:4200',
            'https://essltda.com',
            'https://www.essltda.com',
        ],
    ],

    'uploads' => [
        // Carpeta fisica donde se guardan las imagenes.
        'directorio'   => __DIR__ . '/../public/uploads',
        // URL publica base desde la que se sirven.
        'url_base'     => '/api/uploads',
        'peso_maximo'  => 5 * 1024 * 1024, // 5 MB
        'mimes'        => ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'application/pdf'],
    ],

    'correo' => [
        // Destinatario de las solicitudes del formulario de contacto.
        'destinatario' => 'comercial@essltda.com',
        'remitente'    => 'no-responder@essltda.com',
        'nombre_remitente' => 'Sitio web ESS',
        // true = intenta enviar por mail(). En local dejelo en false: las
        // solicitudes se guardan igual en la base de datos.
        'enviar'       => false,
    ],

    'seguridad' => [
        // Intentos fallidos de login permitidos antes de bloquear temporalmente.
        'max_intentos_login'   => 5,
        'minutos_bloqueo'      => 15,
        // Solicitudes de contacto permitidas por IP en la ventana indicada.
        'max_solicitudes_ip'   => 5,
        'minutos_ventana_form' => 60,
    ],
];
