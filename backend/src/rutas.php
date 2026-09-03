<?php

declare(strict_types=1);

/**
 * Tabla de rutas de la API.
 *
 * @var \Ess\Core\Router  $router
 * @var \Ess\Core\Request $peticion
 */

use Ess\Controllers\AjusteController;
use Ess\Controllers\AuthController;
use Ess\Controllers\MediaController;
use Ess\Controllers\PaginaController;
use Ess\Controllers\PanelController;
use Ess\Controllers\PublicoController;
use Ess\Controllers\SectorController;
use Ess\Controllers\ServicioController;
use Ess\Controllers\SlideController;
use Ess\Controllers\SolicitudController;
use Ess\Controllers\UsuarioController;
use Ess\Core\Request;
use Ess\Core\Response;

$auth       = new AuthController();
$publico    = new PublicoController();
$servicios  = new ServicioController();
$sectores   = new SectorController();
$slides     = new SlideController();
$paginas    = new PaginaController();
$ajustes    = new AjusteController();
$media      = new MediaController();
$solicitudes = new SolicitudController();
$usuarios   = new UsuarioController();
$panel      = new PanelController();

// =====================================================================
// Diagnostico
// =====================================================================
$router->get('/', static function (Request $p): void {
    Response::ok([
        'api'     => 'Escort Security Services',
        'version' => '1.0.0',
        'estado'  => 'operativa',
    ]);
});

// =====================================================================
// Sitio publico (sin autenticacion)
// =====================================================================
$router->get('/publico/bootstrap', [$publico, 'bootstrap']);
$router->get('/publico/ajustes', [$publico, 'ajustes']);
$router->get('/publico/servicios', [$publico, 'servicios']);
$router->get('/publico/servicios/{slug}', [$publico, 'servicio']);
$router->get('/publico/sectores', [$publico, 'sectores']);
$router->get('/publico/paginas/{slug}', [$publico, 'pagina']);
$router->post('/publico/contacto', [$solicitudes, 'recibir']);

// =====================================================================
// Sesion
// =====================================================================
$router->post('/auth/login', [$auth, 'login']);
$router->get('/auth/yo', [$auth, 'yo'])->protegida();
$router->post('/auth/refrescar', [$auth, 'refrescar'])->protegida();
$router->post('/auth/clave', [$auth, 'cambiarClave'])->protegida();
$router->post('/auth/salir', [$auth, 'salir'])->protegida();

// =====================================================================
// Panel administrativo (requiere token)
// =====================================================================
$router->get('/admin/resumen', [$panel, 'resumen'])->protegida();

// Servicios
$router->get('/admin/servicios', [$servicios, 'listar'])->protegida();
$router->post('/admin/servicios', [$servicios, 'crear'])->protegida();
$router->post('/admin/servicios/reordenar', [$servicios, 'reordenar'])->protegida();
$router->get('/admin/servicios/{id}', [$servicios, 'ver'])->protegida();
$router->put('/admin/servicios/{id}', [$servicios, 'actualizar'])->protegida();
$router->delete('/admin/servicios/{id}', [$servicios, 'eliminar'])->protegida();

// Sectores
$router->get('/admin/sectores', [$sectores, 'listar'])->protegida();
$router->post('/admin/sectores', [$sectores, 'crear'])->protegida();
$router->post('/admin/sectores/reordenar', [$sectores, 'reordenar'])->protegida();
$router->get('/admin/sectores/{id}', [$sectores, 'ver'])->protegida();
$router->put('/admin/sectores/{id}', [$sectores, 'actualizar'])->protegida();
$router->delete('/admin/sectores/{id}', [$sectores, 'eliminar'])->protegida();

// Carrusel
$router->get('/admin/slides', [$slides, 'listar'])->protegida();
$router->post('/admin/slides', [$slides, 'crear'])->protegida();
$router->post('/admin/slides/reordenar', [$slides, 'reordenar'])->protegida();
$router->get('/admin/slides/{id}', [$slides, 'ver'])->protegida();
$router->put('/admin/slides/{id}', [$slides, 'actualizar'])->protegida();
$router->delete('/admin/slides/{id}', [$slides, 'eliminar'])->protegida();

// Paginas
$router->get('/admin/paginas', [$paginas, 'listar'])->protegida();
$router->post('/admin/paginas', [$paginas, 'crear'])->protegida();
$router->get('/admin/paginas/{id}', [$paginas, 'ver'])->protegida();
$router->put('/admin/paginas/{id}', [$paginas, 'actualizar'])->protegida();
$router->delete('/admin/paginas/{id}', [$paginas, 'eliminar'])->protegida();

// Ajustes del sitio (colores, contacto, identidad, SEO)
$router->get('/admin/ajustes', [$ajustes, 'listar'])->protegida();
$router->put('/admin/ajustes', [$ajustes, 'guardar'])->protegida();

// Biblioteca de medios
$router->get('/admin/media', [$media, 'listar'])->protegida();
$router->post('/admin/media', [$media, 'subir'])->protegida();
$router->put('/admin/media/{id}', [$media, 'actualizar'])->protegida();
$router->delete('/admin/media/{id}', [$media, 'eliminar'])->protegida();

// Bandeja de solicitudes
$router->get('/admin/solicitudes', [$solicitudes, 'listar'])->protegida();
$router->get('/admin/solicitudes/{id}', [$solicitudes, 'ver'])->protegida();
$router->patch('/admin/solicitudes/{id}', [$solicitudes, 'actualizar'])->protegida();
$router->delete('/admin/solicitudes/{id}', [$solicitudes, 'eliminar'])->protegida();

// Usuarios del panel (solo administradores)
$router->get('/admin/usuarios', [$usuarios, 'listar'])->protegida('admin');
$router->post('/admin/usuarios', [$usuarios, 'crear'])->protegida('admin');
$router->put('/admin/usuarios/{id}', [$usuarios, 'actualizar'])->protegida('admin');
$router->delete('/admin/usuarios/{id}', [$usuarios, 'eliminar'])->protegida('admin');
