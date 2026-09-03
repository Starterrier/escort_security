import { Routes } from '@angular/router';

import { adminGuard, authGuard, invitadoGuard } from './core/guardias/auth.guard';

export const routes: Routes = [
  // ------------------------------------------------------------------
  // Sitio publico
  // ------------------------------------------------------------------
  {
    path: '',
    loadComponent: () => import('./publico/layout/publico.layout').then((m) => m.PublicoLayout),
    children: [
      {
        path: '',
        loadComponent: () => import('./publico/paginas/inicio.page').then((m) => m.InicioPage),
        title: 'Inicio',
      },
      {
        path: 'nosotros',
        loadComponent: () => import('./publico/paginas/pagina.page').then((m) => m.PaginaPage),
        data: { slug: 'nosotros' },
      },
      {
        path: 'servicios',
        loadComponent: () => import('./publico/paginas/servicios.page').then((m) => m.ServiciosPage),
      },
      {
        path: 'servicios/:slug',
        loadComponent: () =>
          import('./publico/paginas/servicio-detalle.page').then((m) => m.ServicioDetallePage),
      },
      {
        path: 'sectores',
        loadComponent: () => import('./publico/paginas/sectores.page').then((m) => m.SectoresPage),
      },
      {
        path: 'contacto',
        loadComponent: () => import('./publico/paginas/contacto.page').then((m) => m.ContactoPage),
      },
      {
        path: 'pagina/:slug',
        loadComponent: () => import('./publico/paginas/pagina.page').then((m) => m.PaginaPage),
      },
    ],
  },

  // ------------------------------------------------------------------
  // Panel administrativo
  // ------------------------------------------------------------------
  {
    path: 'admin/entrar',
    canActivate: [invitadoGuard],
    loadComponent: () => import('./admin/paginas/entrar.page').then((m) => m.EntrarPage),
    title: 'Iniciar sesion',
  },
  {
    path: 'admin',
    canActivate: [authGuard],
    loadComponent: () => import('./admin/layout/admin.layout').then((m) => m.AdminLayout),
    children: [
      {
        path: '',
        loadComponent: () => import('./admin/paginas/tablero.page').then((m) => m.TableroPage),
        title: 'Panel',
      },
      {
        path: 'servicios',
        loadComponent: () =>
          import('./admin/paginas/servicios-admin.page').then((m) => m.ServiciosAdminPage),
        title: 'Servicios',
      },
      {
        path: 'sectores',
        loadComponent: () =>
          import('./admin/paginas/sectores-admin.page').then((m) => m.SectoresAdminPage),
        title: 'Sectores',
      },
      {
        path: 'carrusel',
        loadComponent: () =>
          import('./admin/paginas/slides-admin.page').then((m) => m.SlidesAdminPage),
        title: 'Carrusel',
      },
      {
        path: 'paginas',
        loadComponent: () =>
          import('./admin/paginas/paginas-admin.page').then((m) => m.PaginasAdminPage),
        title: 'Paginas',
      },
      {
        path: 'apariencia',
        loadComponent: () =>
          import('./admin/paginas/ajustes-admin.page').then((m) => m.AjustesAdminPage),
        title: 'Apariencia y ajustes',
      },
      {
        path: 'medios',
        loadComponent: () => import('./admin/paginas/medios-admin.page').then((m) => m.MediosAdminPage),
        title: 'Biblioteca',
      },
      {
        path: 'solicitudes',
        loadComponent: () =>
          import('./admin/paginas/solicitudes-admin.page').then((m) => m.SolicitudesAdminPage),
        title: 'Solicitudes',
      },
      {
        path: 'usuarios',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./admin/paginas/usuarios-admin.page').then((m) => m.UsuariosAdminPage),
        title: 'Usuarios',
      },
      {
        path: 'cuenta',
        loadComponent: () => import('./admin/paginas/cuenta.page').then((m) => m.CuentaPage),
        title: 'Mi cuenta',
      },
    ],
  },

  { path: '**', redirectTo: '' },
];
