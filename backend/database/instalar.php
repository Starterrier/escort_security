<?php

declare(strict_types=1);

/**
 * Instalador de la base de datos.
 *
 * Crea las tablas, siembra el contenido del portafolio 2022 y genera el
 * usuario administrador inicial.
 *
 * Uso:
 *   php database/instalar.php
 *   php database/instalar.php --reiniciar        (borra y recrea las tablas)
 *   php database/instalar.php --admin=correo@dominio.com --clave=MiClave123
 */

use Ess\Core\Config;
use Ess\Core\Database;
use Ess\Core\Validator;

define('ESS_RAIZ', dirname(__DIR__));

if (PHP_SAPI !== 'cli') {
    http_response_code(403);
    exit('Este script solo se ejecuta desde la linea de comandos.');
}

spl_autoload_register(static function (string $clase): void {
    if (strncmp($clase, 'Ess\\', 4) !== 0) {
        return;
    }
    $ruta = ESS_RAIZ . '/src/' . str_replace('\\', '/', substr($clase, 4)) . '.php';
    if (is_file($ruta)) {
        require $ruta;
    }
});

Config::cargar(ESS_RAIZ . '/config/config.php');
date_default_timezone_set('America/Bogota');

// --- Argumentos -------------------------------------------------------------
$opciones = getopt('', ['reiniciar', 'admin::', 'clave::', 'nombre::']);
$reiniciar = array_key_exists('reiniciar', $opciones);
$adminEmail = (string) ($opciones['admin'] ?? 'admin@essltda.com');
$adminClave = (string) ($opciones['clave'] ?? '');
$adminNombre = (string) ($opciones['nombre'] ?? 'Administrador');

$linea = static function (string $texto): void {
    echo $texto, PHP_EOL;
};

$linea('== Instalador ESCORT SECURITY SERVICES ==');
$linea('Base de datos: ' . Config::get('db.nombre') . ' en ' . Config::get('db.host'));

$pdo = Database::conexion();

// --- Tablas -----------------------------------------------------------------
if ($reiniciar) {
    $linea('-> Eliminando tablas existentes...');
    $pdo->exec('SET FOREIGN_KEY_CHECKS = 0');
    foreach (['solicitudes', 'servicio_items', 'servicios', 'sectores', 'slides', 'paginas', 'ajustes', 'media', 'intentos_acceso', 'usuarios'] as $tabla) {
        $pdo->exec('DROP TABLE IF EXISTS ' . $tabla);
    }
    $pdo->exec('SET FOREIGN_KEY_CHECKS = 1');
}

$linea('-> Creando tablas...');
$esquema = (string) file_get_contents(__DIR__ . '/schema.sql');

foreach (array_filter(array_map('trim', explode(';', $esquema))) as $sentencia) {
    if (strpos($sentencia, '--') === 0 && strpos($sentencia, "\n") === false) {
        continue;
    }
    $pdo->exec($sentencia);
}

// --- Usuario administrador --------------------------------------------------
$existe = (int) Database::valor('SELECT COUNT(*) FROM usuarios');

if ($existe === 0) {
    if ($adminClave === '') {
        $adminClave = bin2hex(random_bytes(6)); // 12 caracteres
    }

    Database::insertar('usuarios', [
        'nombre'        => $adminNombre,
        'email'         => strtolower($adminEmail),
        'password_hash' => password_hash($adminClave, PASSWORD_DEFAULT),
        'rol'           => 'admin',
        'activo'        => 1,
    ]);

    $linea('');
    $linea('   ******************************************************');
    $linea('   USUARIO ADMINISTRADOR CREADO');
    $linea('   Correo    : ' . strtolower($adminEmail));
    $linea('   Contrasena: ' . $adminClave);
    $linea('   Cambiela desde el panel al primer ingreso.');
    $linea('   ******************************************************');
    $linea('');
} else {
    $linea('-> Ya existen usuarios: no se crea ninguno nuevo.');
}

// --- Contenido inicial ------------------------------------------------------
$yaSembrado = (int) Database::valor('SELECT COUNT(*) FROM servicios') > 0;

if ($yaSembrado) {
    $linea('-> El contenido ya estaba sembrado. Nada que hacer.');
    $linea('Listo.');
    exit(0);
}

$linea('-> Sembrando contenido del portafolio...');

/**
 * Servicios tomados del portafolio de servicios 2022.
 *
 * @var array<int,array{titulo:string,categoria:string,icono:string,destacado:bool,resumen:string,descripcion:string,items:array<int,string>}>
 */
$servicios = [
    [
        'titulo'    => 'Vigilancia y seguridad privada',
        'categoria' => 'Seguridad',
        'icono'     => 'shield',
        'destacado' => true,
        'resumen'   => 'Esquemas de proteccion a instalaciones y personas con vigilancia fija, movil y escolta, respaldados por monitoreo y reaccion.',
        'descripcion' => '<p>Disenamos esquemas de proteccion a instalaciones, personas, dignatarios, diplomaticos y extranjeros, a objetivos especificos, con acompanamiento a carga critica y aseguramiento de puntos criticos.</p>'
            . '<p>Operamos sistemas de vigilancia y contravigilancia estatica y movil, monitoreo, video referencia y reaccion, con personal certificado por nuestra propia escuela de capacitacion aprobada por la Supervigilancia.</p>',
        'items' => [
            'Vigilancia fija con y sin armas',
            'Vigilancia movil y patrullaje',
            'Servicio de escolta a personas y carga',
            'Aseguramiento de puntos criticos',
            'Monitoreo, video referencia y reaccion',
            'Medios tecnologicos y caninos de apoyo',
        ],
    ],
    [
        'titulo'    => 'Gerencia y gestion del riesgo',
        'categoria' => 'Seguridad',
        'icono'     => 'radar',
        'destacado' => true,
        'resumen'   => 'Identificamos, evaluamos y calificamos los riesgos corporativos, y ejecutamos planes de accion medibles.',
        'descripcion' => '<p>Gestionamos riesgos corporativos, auditamos procesos, controlamos perdidas, evaluamos y calificamos riesgos, desarrollamos estrategias y ejecutamos planes de accion.</p>'
            . '<p>Acompanamos a la alta direccion en la toma de decisiones y en la respuesta a situaciones y eventos criticos.</p>',
        'items' => [
            'Analisis y apreciacion de riesgos',
            'Control de perdidas',
            'Planes de accion y de continuidad',
            'Acompanamiento en eventos criticos',
            'Interventorias de seguridad',
        ],
    ],
    [
        'titulo'    => 'Auditorias de seguridad',
        'categoria' => 'Auditorias',
        'icono'     => 'clipboard',
        'destacado' => true,
        'resumen'   => 'Revision integral de procesos, instalaciones y personas para cerrar las brechas antes de que se conviertan en perdidas.',
        'descripcion' => '<p>Evaluamos el estado real de la seguridad de su operacion y entregamos un informe con hallazgos priorizados y recomendaciones aplicables.</p>',
        'items' => [
            'Analisis de procesos - OEA',
            'Estudio de seguridad fisica',
            'Analisis integral de procesos',
            'Panorama de riesgos',
            'Evaluacion de riesgo psicosocial',
        ],
    ],
    [
        'titulo'    => 'Inteligencia y confiabilidad',
        'categoria' => 'Inteligencia',
        'icono'     => 'search',
        'destacado' => true,
        'resumen'   => 'Estudios de confiabilidad, visita domiciliaria y poligrafia para decidir a quien vincula y en quien confia.',
        'descripcion' => '<p>Verificamos la informacion de candidatos y colaboradores con procedimientos tecnicos y personal certificado, protegiendo su operacion desde la seleccion.</p>',
        'items' => [
            'Estudio de confiabilidad de seleccion',
            'Visita domiciliaria',
            'Comprobaciones de lealtad',
            'Poligrafo de seleccion',
            'Poligrafo de rutina',
        ],
    ],
    [
        'titulo'    => 'Investigacion corporativa',
        'categoria' => 'Investigacion',
        'icono'     => 'file-search',
        'destacado' => false,
        'resumen'   => 'Esclarecemos siniestros, faltas disciplinarias y fugas de informacion con soporte probatorio.',
        'descripcion' => '<p>Realizamos investigaciones administrativas y por siniestro con metodologia documentada, cadena de custodia de la evidencia y entrega de informes que soportan las decisiones de la empresa.</p>',
        'items' => [
            'Investigacion por siniestro',
            'Investigaciones administrativas',
            'Compliance',
            'Contravigilancia',
            'Poligrafo especifico',
        ],
    ],
    [
        'titulo'    => 'Operaciones y acompanamiento',
        'categoria' => 'Operaciones',
        'icono'     => 'truck',
        'destacado' => false,
        'resumen'   => 'Acompanamiento OEA, redes de informacion y capacitacion para su equipo.',
        'descripcion' => '<p>Apoyamos la operacion diaria con acompanamiento en procesos OEA, gerencia de riesgos, interventorias, redes de informacion y transferencia de conocimiento a sus equipos.</p>',
        'items' => [
            'Acompanamiento OEA',
            'Gerencia de riesgos',
            'Interventorias',
            'Redes de informacion',
            'Capacitaciones y talleres',
        ],
    ],
    [
        'titulo'    => 'Asesorias y consultorias',
        'categoria' => 'Consultoria',
        'icono'     => 'briefcase',
        'destacado' => false,
        'resumen'   => 'Acompanamiento tecnico para disenar, implementar y auditar su modelo de seguridad.',
        'descripcion' => '<p>Asesoramos en la estructuracion de departamentos de seguridad, manuales de procedimiento, politicas y esquemas de proteccion adaptados a la realidad de cada operacion.</p>',
        'items' => [
            'Diseno de esquemas de proteccion',
            'Manuales y politicas de seguridad',
            'Estudios de seguridad de instalaciones',
            'Acompanamiento en certificaciones',
        ],
    ],
    [
        'titulo'    => 'Capacitacion y entrenamiento',
        'categoria' => 'Formacion',
        'icono'     => 'graduation',
        'destacado' => false,
        'resumen'   => 'Escuela propia aprobada por la Supervigilancia para formar y actualizar al personal de seguridad.',
        'descripcion' => '<p>Contamos con nuestra propia escuela de capacitacion debidamente aprobada por la SVSP. El departamento de talento humano diseno un plan integral con el que aseguramos que cada colaborador conozca las tecnicas de manejo de servicio al cliente y buen trato, garantizando un servicio dinamico y activo.</p>',
        'items' => [
            'Fundamentacion y reentrenamiento',
            'Servicio al cliente y buen trato',
            'Manejo de situaciones criticas',
            'Talleres a medida para su empresa',
        ],
    ],
];

foreach ($servicios as $orden => $servicio) {
    $id = Database::insertar('servicios', [
        'slug'        => Validator::slug($servicio['titulo']),
        'titulo'      => $servicio['titulo'],
        'categoria'   => $servicio['categoria'],
        'resumen'     => $servicio['resumen'],
        'descripcion' => $servicio['descripcion'],
        'icono'       => $servicio['icono'],
        'destacado'   => $servicio['destacado'] ? 1 : 0,
        'orden'       => $orden,
        'activo'      => 1,
        'meta_titulo' => $servicio['titulo'] . ' | Escort Security Services',
        'meta_descripcion' => mb_substr($servicio['resumen'], 0, 300),
    ]);

    foreach ($servicio['items'] as $posicion => $texto) {
        Database::insertar('servicio_items', [
            'servicio_id' => $id,
            'texto'       => $texto,
            'orden'       => $posicion,
        ]);
    }
}

$linea('   ' . count($servicios) . ' servicios creados.');

// --- Sectores ---------------------------------------------------------------
$sectores = [
    ['Residencial', 'Conjuntos, edificios y unidades cerradas con control de acceso y rondas.', 'home'],
    ['Bancario', 'Oficinas, cajeros y transporte de valores con protocolos reforzados.', 'bank'],
    ['Hospitalario', 'Clinicas y hospitales con control de visitantes y areas restringidas.', 'hospital'],
    ['Hidrocarburos', 'Campos, refinerias y estaciones con esquemas de alto riesgo.', 'fuel'],
    ['Comercial', 'Centros comerciales y retail con prevencion de perdidas.', 'store'],
    ['Portuaria', 'Puertos y patios de contenedores con acompanamiento OEA.', 'anchor'],
    ['Transporte', 'Flotas y carga critica con escolta y monitoreo en ruta.', 'truck'],
    ['Mineria', 'Operaciones mineras con control de accesos y areas remotas.', 'mountain'],
    ['Industrial', 'Plantas y parques industriales con vigilancia integral.', 'factory'],
    ['Agroindustrial', 'Cultivos, silos y centros de acopio en zona rural.', 'wheat'],
];

foreach ($sectores as $orden => [$nombre, $descripcion, $icono]) {
    Database::insertar('sectores', [
        'slug'        => Validator::slug($nombre),
        'nombre'      => $nombre,
        'descripcion' => $descripcion,
        'icono'       => $icono,
        'orden'       => $orden,
        'activo'      => 1,
    ]);
}

$linea('   ' . count($sectores) . ' sectores creados.');

// --- Carrusel ---------------------------------------------------------------
$slides = [
    [
        'titulo'    => 'Profesionales al servicio de su tranquilidad',
        'subtitulo' => 'Vigilancia y seguridad privada',
        'texto'     => 'Percibimos, prevenimos, protegemos y perseveramos. Su recurso humano, sus activos, su informacion y su imagen corporativa en manos profesionales.',
        'cta_texto' => 'Solicitar asesoria',
        'cta_url'   => '/contacto',
    ],
    [
        'titulo'    => 'Abarcamos todos los riesgos de tu empresa',
        'subtitulo' => 'Gestion integral del riesgo',
        'texto'     => 'Profesionales y herramientas tecnologicas que mitigan y administran la amenaza, con asesoria en la toma de decisiones y acompanamiento en eventos criticos.',
        'cta_texto' => 'Conocer los servicios',
        'cta_url'   => '/servicios',
    ],
    [
        'titulo'    => 'Escuela propia de capacitacion',
        'subtitulo' => 'Personal formado y certificado',
        'texto'     => 'Contamos con escuela de capacitacion aprobada por la Supervigilancia, lo que nos hace competentes en cada actividad que ejecutamos.',
        'cta_texto' => 'Sobre nosotros',
        'cta_url'   => '/nosotros',
    ],
];

foreach ($slides as $orden => $slide) {
    Database::insertar('slides', $slide + ['orden' => $orden, 'activo' => 1]);
}

$linea('   ' . count($slides) . ' diapositivas creadas.');

// --- Paginas ----------------------------------------------------------------
$paginas = [
    [
        'slug'      => 'nosotros',
        'titulo'    => 'Nosotros',
        'subtitulo' => 'Percibimos, prevenimos, protegemos y perseveramos',
        'sistema'   => 1,
        'contenido' => '<p>Le garantizamos a nuestros clientes que su recurso humano, activos, informacion, operacion e imagen corporativa se encuentran en manos profesionales. '
            . 'Contamos con infraestructura propia, personal capacitado y certificado para la ejecucion de recursos en la gestion y manejo del riesgo; que, junto con nuestra actual tecnologia, garantiza alta eficacia en todos nuestros procesos.</p>'
            . '<h3>Nuestra esencia</h3>'
            . '<p>El compromiso con nuestro recurso humano, en educacion, formacion y bienestar nos brinda la tranquilidad con practicas responsables en el lugar de trabajo, respetando los derechos humanos, la diversidad cultural y el ordenamiento juridico y social. '
            . 'La responsabilidad social para con nuestros colaboradores es parte fundamental en el crecimiento de nuestra compania, brindando oportunidad en educacion y desarrollo tanto personal como profesional.</p>'
            . '<p>Gracias a nuestra experiencia generamos un servicio que sobrepasa las expectativas y las necesidades del cliente, permitiendo la adaptacion de procesos y sistemas de seguridad concordantes con la realidad que vive el pais y el mundo con la nueva era digital, previniendo los riesgos de un ambiente inseguro tanto interno como externo.</p>',
        'meta_titulo'      => 'Nosotros | Escort Security Services',
        'meta_descripcion' => 'Empresa de vigilancia y seguridad privada con infraestructura propia, personal certificado y escuela de capacitacion aprobada por la Supervigilancia.',
    ],
    [
        'slug'      => 'responsabilidad-social',
        'en_menu'   => 1,
        'titulo'    => 'Responsabilidad social',
        'subtitulo' => 'Nuestro compromiso con las personas',
        'sistema'   => 0,
        'contenido' => '<p>Contamos con un recurso humano cuidadosamente seleccionado, capacitado y entrenado en el mercado de la seguridad privada, con los mas altos estandares de calidad a nivel nacional.</p>'
            . '<p>La implementacion del Sistema de Gestion en Seguridad y Salud en el Trabajo es uno de nuestros pilares fundamentales, ya que permite la verificacion de la calidad del capital humano de nuestra empresa, como tambien la implementacion de programas de bienestar para motivar y generar un sentido de pertenencia de nuestros colaboradores, orientado a la excelencia de nuestro servicio.</p>',
        'meta_titulo'      => 'Responsabilidad social empresarial | Escort Security Services',
        'meta_descripcion' => 'Sistema de Gestion en Seguridad y Salud en el Trabajo, bienestar y desarrollo del personal de Escort Security Services.',
    ],
    [
        'slug'      => 'politica-de-tratamiento-de-datos',
        'titulo'    => 'Politica de tratamiento de datos',
        'subtitulo' => 'Ley 1581 de 2012',
        'sistema'   => 0,
        'contenido' => '<p>Escort Security Services trata los datos personales recolectados a traves de este sitio unicamente para atender solicitudes comerciales y de servicio. '
            . 'El titular puede conocer, actualizar, rectificar o suprimir sus datos escribiendo a comercial@essltda.com.</p>'
            . '<p><strong>Edite este texto desde el panel administrativo con la politica oficial de la compania.</strong></p>',
        'meta_titulo'      => 'Politica de tratamiento de datos | Escort Security Services',
        'meta_descripcion' => 'Politica de tratamiento de datos personales de Escort Security Services conforme a la Ley 1581 de 2012.',
    ],
];

foreach ($paginas as $orden => $pagina) {
    Database::insertar(
        'paginas',
        $pagina + ['imagen_id' => null, 'activo' => 1, 'en_menu' => 0, 'orden' => $orden]
    );
}

$linea('   ' . count($paginas) . ' paginas creadas.');
$linea('');
$linea('Listo. Levante la API y entre al panel con el usuario mostrado arriba.');
