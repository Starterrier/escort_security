# Despliegue en producción

Dos escenarios: **hosting compartido con cPanel** (lo habitual para un dominio
como essltda.com) y **VPS con dominio propio para la API**.

---

## Opción A — Hosting compartido (cPanel)

El sitio Angular vive en `public_html/` y la API en `public_html/api/`.
Así no hay CORS entre ambos y el certificado SSL es uno solo.

### 1. Compilar el frontend

En su equipo:

```bash
cd frontend
npm ci
npm run build
```

El resultado queda en `frontend/dist/frontend/browser/`. Ese build usa
`environment.prod.ts`, que apunta la API a `/api`.

### 2. Subir los archivos

Estructura final en el servidor:

```
public_html/
├── index.html              <- contenido de dist/frontend/browser/
├── main-XXXX.js
├── styles-XXXX.css
├── .htaccess               <- viene de frontend/public/.htaccess
└── api/                    <- contenido de backend/public/
    ├── index.php
    ├── .htaccess
    └── uploads/
```

**Forma recomendada.** Suba `backend/` completo a un nivel por encima de
`public_html` (por ejemplo `/home/usuario/ess-backend/`), copie el contenido de
`backend/public/` dentro de `public_html/api/` y añada esta línea al principio de
`public_html/api/.htaccess`:

```apache
SetEnv ESS_RAIZ /home/usuario/ess-backend
```

No hay que editar ningún archivo PHP: `index.php` lee esa variable y, si no
existe, usa la carpeta superior.

**Alternativa.** Si su plan no permite salir de `public_html`, suba `backend/`
entero como `public_html/api-src/`, copie `backend/public/*` a `public_html/api/`
y use `SetEnv ESS_RAIZ /home/usuario/public_html/api-src`. Los `.htaccess` de
`config/`, `src/`, `database/` y `storage/` bloquean el acceso web a esas
carpetas.

### 3. Base de datos

1. En cPanel → **Bases de datos MySQL**, cree la base y un usuario con todos los
   permisos sobre ella.
2. Copie `config/config.example.php` a `config/config.php` y complete:

```php
'entorno' => 'produccion',
'db' => [
    'host'    => 'localhost',
    'nombre'  => 'usuario_essltda',
    'usuario' => 'usuario_essuser',
    'clave'   => 'LA-CLAVE-DEL-HOSTING',
],
'jwt' => [
    'secreto' => 'PEGUE-AQUI-64-CARACTERES-ALEATORIOS',
],
'cors' => [
    'origenes' => ['https://essltda.com', 'https://www.essltda.com'],
],
'uploads' => [
    'url_base' => '/api/uploads',
],
'correo' => [
    'destinatario' => 'comercial@essltda.com',
    'remitente'    => 'no-responder@essltda.com',
    'enviar'       => true,
],
```

Genere el secreto JWT con:

```bash
php -r "echo bin2hex(random_bytes(32));"
```

3. Ejecute el instalador. Si tiene acceso SSH:

```bash
cd /home/usuario/ess-backend
php database/instalar.php --admin=comercial@essltda.com --clave=UnaClaveLarga2026
```

Si no tiene SSH, use **phpMyAdmin** e importe `database/schema.sql`; después cree
el usuario administrador con el hash que genere localmente:

```bash
php -r "echo password_hash('UnaClaveLarga2026', PASSWORD_DEFAULT);"
```

```sql
INSERT INTO usuarios (nombre, email, password_hash, rol, activo)
VALUES ('Administrador', 'comercial@essltda.com', '<hash>', 'admin', 1);
```

(El contenido inicial de servicios y sectores solo lo siembra `instalar.php`; sin
SSH tendrá que cargarlo desde el panel.)

### 4. Permisos

```bash
chmod 755 public_html/api/uploads
chmod 755 ess-backend/storage/logs
chmod 600 ess-backend/config/config.php
```

> Si `SetEnv` está deshabilitado en su hosting, edite directamente la línea
> `define('ESS_RAIZ', ...)` de `public_html/api/index.php` con la ruta absoluta.

La carpeta `uploads/` debe ser escribible por el usuario de PHP; en cPanel suele
bastar `755`.

### 5. Comprobaciones

- `https://essltda.com/api/` → `{"ok":true,"datos":{"api":"Escort Security Services",...}}`
- `https://essltda.com/api/publico/bootstrap` → devuelve ajustes y servicios.
- `https://essltda.com/` → carga el sitio.
- `https://essltda.com/admin` → pide credenciales.
- Recargue `https://essltda.com/servicios` con F5: debe seguir funcionando (eso
  confirma que el `.htaccess` del frontend está activo).

---

## Opción B — VPS

Con la API en un subdominio (`api.essltda.com`) y el sitio en `essltda.com`.

Nginx:

```nginx
server {
    server_name essltda.com www.essltda.com;
    root /var/www/ess/frontend;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}

server {
    server_name api.essltda.com;
    root /var/www/ess/backend/public;
    index index.php;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/run/php/php8.2-fpm.sock;
    }

    # Nunca ejecutar PHP dentro de uploads.
    location ^~ /uploads/ {
        location ~ \.php$ { return 403; }
    }

    client_max_body_size 6M;
}
```

En `config.php`:

```php
'cors'    => ['origenes' => ['https://essltda.com', 'https://www.essltda.com']],
'uploads' => ['url_base' => 'https://api.essltda.com/uploads'],
```

Y en `frontend/src/environments/environment.prod.ts`:

```ts
export const environment = { produccion: true, apiUrl: 'https://api.essltda.com' };
```

---

## Correo saliente

`Mailer` usa la función `mail()` de PHP. Muchos hostings la bloquean o el correo
termina en spam. Si necesita SMTP autenticado:

1. Suba PHPMailer a `backend/lib/PHPMailer/`.
2. Reemplace el cuerpo de `Mailer::enviar()` manteniendo la firma
   (`enviar(string $asunto, string $cuerpoHtml, ?string $responderA): bool`).
   Nada más del código cambia.

Mientras tanto, **ninguna solicitud se pierde**: todas quedan guardadas en la
tabla `solicitudes` y visibles en el panel, aunque el correo falle.

---

## Actualizaciones posteriores

Frontend:

```bash
cd frontend && npm run build
# subir de nuevo el contenido de dist/frontend/browser/ a public_html/
```

Backend: subir los archivos de `src/` modificados. Si cambió `schema.sql`,
aplique la migración a mano en phpMyAdmin — `instalar.php` solo crea tablas que
no existan y no altera las que ya están.

---

## Copias de seguridad

Respalde tres cosas:

1. La base de datos (`mysqldump essltda`).
2. La carpeta `public_html/api/uploads/` con las imágenes.
3. `config/config.php` (guárdelo aparte: contiene claves).

---

## Recomendaciones de seguridad para el sitio en vivo

- Fuerce HTTPS en todo el dominio (en cPanel, con "Forzar redirección HTTPS").
- Cambie la contraseña del administrador en el primer ingreso, desde
  **Mi cuenta**.
- Cree usuarios con perfil **editor** para quien solo publique contenido; el
  perfil **administrador** debe quedar en pocas manos.
- Mantenga `'entorno' => 'produccion'` para que los errores no se muestren al
  visitante (quedan en `storage/logs/`).
- Revise `storage/logs/` de vez en cuando y bórrelo periódicamente.
