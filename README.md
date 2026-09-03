# Escort Security Services — sitio web y panel de administración

Sitio web corporativo de **Escort Security Services** (essltda.com) con panel
administrativo propio: la empresa cambia servicios, sectores, imágenes, textos,
colores y datos de contacto sin tocar código.

- **Frontend:** Angular 22 (componentes standalone, señales, carga diferida por ruta).
- **Backend:** API REST en PHP 8 + MySQL, sin frameworks ni Composer.
- **Autenticación:** JWT HS256 firmado en el servidor.

El contenido inicial está tomado del portafolio de servicios 2022 de la empresa
(`portafolio-de-servicios-services.pdf`).

---

## Estructura

```
escort_security/
├── backend/                    API PHP
│   ├── config/                 config.php (no se versiona) y config.example.php
│   ├── database/               schema.sql e instalar.php
│   ├── public/                 raíz web de la API: index.php, .htaccess, uploads/
│   ├── src/
│   │   ├── Core/               Router, Request, Response, Jwt, Auth, Validator, ...
│   │   ├── Controllers/        un controlador por recurso
│   │   ├── Repositories/       consultas de ajustes y medios
│   │   └── rutas.php           tabla de rutas
│   └── storage/logs/           registro de errores
├── frontend/                   Aplicación Angular
│   └── src/app/
│       ├── core/               modelos, servicios, guardias, interceptores
│       ├── publico/            sitio público (layout + páginas)
│       ├── admin/              panel administrativo
│       └── compartido/         iconos y componentes comunes
└── docs/DESPLIEGUE.md          puesta en producción paso a paso
```

---

## Puesta en marcha en local

Requisitos: PHP 8.0+ con `pdo_mysql`, MySQL/MariaDB y Node 20+.

### 1. Base de datos y API

```bash
cd backend
cp config/config.example.php config/config.php
```

Edite `config/config.php` con los datos de su MySQL y genere una clave JWT:

```bash
php -r "echo bin2hex(random_bytes(32));"
```

Cree la base de datos e instale las tablas y el contenido inicial:

```bash
mysql -u root -e "CREATE DATABASE essltda CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
php database/instalar.php --admin=correo@essltda.com --clave=SuClaveSegura
```

El instalador imprime el usuario y la contraseña del administrador. Con
`--reiniciar` borra y recrea todo.

Levante la API:

```bash
php -S 127.0.0.1:8391 -t public public/router-dev.php
```

Compruebe que responde: <http://127.0.0.1:8391/publico/bootstrap>

### 2. Frontend

```bash
cd frontend
npm install
npm start
```

- Sitio público: <http://localhost:4200>
- Panel: <http://localhost:4200/admin>

`src/environments/environment.ts` apunta a `http://127.0.0.1:8391`. Si cambia el
puerto de la API, ajústelo ahí y añada el origen en `cors.origenes` de
`config.php`.

---

## Qué se administra desde el panel

| Sección | Qué permite |
|---|---|
| **Resumen** | Contadores del sitio, gráfico de solicitudes de los últimos 14 días. |
| **Servicios** | Crear, editar, ordenar, publicar/ocultar. Incluye viñetas de alcance, icono, imagen, destacado en portada y campos SEO. |
| **Sectores** | Industrias atendidas, con icono o foto propia. |
| **Carrusel** | Diapositivas de la portada: título, texto, botón e imagen de fondo. |
| **Páginas** | Contenido HTML de Nosotros, políticas y páginas nuevas; se elige cuáles salen en el menú. |
| **Biblioteca** | Subida de imágenes y PDF, texto alternativo, borrado con aviso si están en uso. |
| **Solicitudes** | Bandeja del formulario de contacto: estado, notas internas y respuesta por correo. |
| **Apariencia y ajustes** | Colores, tipografía, radio de bordes, logo, favicon, datos de contacto, redes, textos de portada, cifras y SEO. |
| **Usuarios** | Altas del panel con perfil administrador o editor. |

Los colores se aplican como variables CSS en tiempo de ejecución: al guardar la
paleta, todo el sitio se repinta sin recompilar nada.

---

## Seguridad implementada

- Contraseñas con `password_hash` (bcrypt) y verificación en tiempo constante.
- JWT firmado con HMAC-SHA256 y `token_version` por usuario: cambiar la clave o
  desactivar una cuenta invalida las sesiones abiertas.
- Bloqueo temporal tras 5 intentos fallidos de acceso, por correo y por IP.
- Todas las consultas van por sentencias preparadas de PDO.
- Validación y saneamiento de entrada en el servidor; el HTML del editor se
  limpia de `<script>`, iframes y atributos `on*`.
- Subidas: el tipo se deduce del contenido con `finfo`, no del nombre; el
  archivo se renombra y la carpeta `uploads/` tiene el motor PHP apagado.
- Límite de solicitudes de contacto por IP y campo trampa contra robots.
- CORS restringido a los orígenes declarados en la configuración.
- Las carpetas `config/`, `src/`, `database/` y `storage/` bloquean el acceso web.

---

## Despliegue

Vea [docs/DESPLIEGUE.md](docs/DESPLIEGUE.md) para la publicación en hosting
compartido (cPanel) y en VPS.

---

## Datos de la empresa en el sitio

Tomados del sitio actual y del portafolio; todos son editables desde
**Apariencia y ajustes → Contacto**:

- Teléfono: 601 749 5172
- WhatsApp: +57 312 473 1224
- Correo: comercial@essltda.com
- Dirección: Calle 57 # 24-22, Bogotá D.C.
- Horario: lunes a viernes, 9:00 a. m. – 6:00 p. m.
- Vigilado Supervigilancia — Resolución 20213900007 del 28 de febrero de 2021
