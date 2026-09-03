-- =====================================================================
--  ESCORT SECURITY SERVICES - Esquema de base de datos
--  MySQL 5.7+ / MariaDB 10.3+
-- =====================================================================

SET NAMES utf8mb4;

-- ---------------------------------------------------------------------
-- Usuarios del panel administrativo
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS usuarios (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nombre          VARCHAR(120)  NOT NULL,
  email           VARCHAR(190)  NOT NULL,
  password_hash   VARCHAR(255)  NOT NULL,
  rol             ENUM('admin','editor') NOT NULL DEFAULT 'editor',
  activo          TINYINT(1)    NOT NULL DEFAULT 1,
  ultimo_acceso   DATETIME      NULL,
  token_version   INT UNSIGNED  NOT NULL DEFAULT 1,
  creado_en       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_usuarios_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Intentos de acceso (freno de fuerza bruta)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS intentos_acceso (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  email      VARCHAR(190) NOT NULL,
  ip         VARCHAR(45)  NOT NULL,
  exitoso    TINYINT(1)   NOT NULL DEFAULT 0,
  creado_en  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_intentos_email_fecha (email, creado_en),
  KEY idx_intentos_ip_fecha (ip, creado_en)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Biblioteca de medios
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS media (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  archivo         VARCHAR(255) NOT NULL,
  ruta            VARCHAR(255) NOT NULL,
  nombre_original VARCHAR(255) NOT NULL,
  mime            VARCHAR(100) NOT NULL,
  peso            INT UNSIGNED NOT NULL DEFAULT 0,
  ancho           INT UNSIGNED NULL,
  alto            INT UNSIGNED NULL,
  alt             VARCHAR(255) NOT NULL DEFAULT '',
  subido_por      INT UNSIGNED NULL,
  creado_en       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_media_creado (creado_en),
  CONSTRAINT fk_media_usuario FOREIGN KEY (subido_por) REFERENCES usuarios (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Ajustes del sitio (clave/valor con soporte JSON)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ajustes (
  clave          VARCHAR(100) NOT NULL,
  grupo          VARCHAR(50)  NOT NULL DEFAULT 'general',
  valor          LONGTEXT     NULL,
  tipo           ENUM('texto','numero','booleano','json','color','media') NOT NULL DEFAULT 'texto',
  actualizado_en DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (clave),
  KEY idx_ajustes_grupo (grupo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Diapositivas del carrusel principal
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS slides (
  id             INT UNSIGNED NOT NULL AUTO_INCREMENT,
  titulo         VARCHAR(180) NOT NULL,
  subtitulo      VARCHAR(255) NOT NULL DEFAULT '',
  texto          TEXT         NULL,
  cta_texto      VARCHAR(80)  NOT NULL DEFAULT '',
  cta_url        VARCHAR(255) NOT NULL DEFAULT '',
  imagen_id      INT UNSIGNED NULL,
  orden          INT          NOT NULL DEFAULT 0,
  activo         TINYINT(1)   NOT NULL DEFAULT 1,
  creado_en      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_slides_orden (activo, orden),
  CONSTRAINT fk_slides_media FOREIGN KEY (imagen_id) REFERENCES media (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Servicios
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS servicios (
  id               INT UNSIGNED NOT NULL AUTO_INCREMENT,
  slug             VARCHAR(160) NOT NULL,
  titulo           VARCHAR(180) NOT NULL,
  categoria        VARCHAR(80)  NOT NULL DEFAULT 'general',
  resumen          VARCHAR(400) NOT NULL DEFAULT '',
  descripcion      LONGTEXT     NULL,
  icono            VARCHAR(60)  NOT NULL DEFAULT 'shield',
  imagen_id        INT UNSIGNED NULL,
  destacado        TINYINT(1)   NOT NULL DEFAULT 0,
  orden            INT          NOT NULL DEFAULT 0,
  activo           TINYINT(1)   NOT NULL DEFAULT 1,
  meta_titulo      VARCHAR(180) NOT NULL DEFAULT '',
  meta_descripcion VARCHAR(300) NOT NULL DEFAULT '',
  creado_en        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_servicios_slug (slug),
  KEY idx_servicios_listado (activo, orden),
  CONSTRAINT fk_servicios_media FOREIGN KEY (imagen_id) REFERENCES media (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Vinetas / alcance de cada servicio
CREATE TABLE IF NOT EXISTS servicio_items (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  servicio_id INT UNSIGNED NOT NULL,
  texto       VARCHAR(255) NOT NULL,
  orden       INT          NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY idx_items_servicio (servicio_id, orden),
  CONSTRAINT fk_items_servicio FOREIGN KEY (servicio_id) REFERENCES servicios (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Sectores atendidos
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sectores (
  id             INT UNSIGNED NOT NULL AUTO_INCREMENT,
  slug           VARCHAR(160) NOT NULL,
  nombre         VARCHAR(120) NOT NULL,
  descripcion    VARCHAR(400) NOT NULL DEFAULT '',
  icono          VARCHAR(60)  NOT NULL DEFAULT 'building',
  imagen_id      INT UNSIGNED NULL,
  orden          INT          NOT NULL DEFAULT 0,
  activo         TINYINT(1)   NOT NULL DEFAULT 1,
  creado_en      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_sectores_slug (slug),
  KEY idx_sectores_listado (activo, orden),
  CONSTRAINT fk_sectores_media FOREIGN KEY (imagen_id) REFERENCES media (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Paginas de contenido (Nosotros, Esencia, RSE, politicas...)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS paginas (
  id               INT UNSIGNED NOT NULL AUTO_INCREMENT,
  slug             VARCHAR(160) NOT NULL,
  titulo           VARCHAR(180) NOT NULL,
  subtitulo        VARCHAR(255) NOT NULL DEFAULT '',
  contenido        LONGTEXT     NULL,
  imagen_id        INT UNSIGNED NULL,
  meta_titulo      VARCHAR(180) NOT NULL DEFAULT '',
  meta_descripcion VARCHAR(300) NOT NULL DEFAULT '',
  sistema          TINYINT(1)   NOT NULL DEFAULT 0,
  en_menu          TINYINT(1)   NOT NULL DEFAULT 0,
  orden            INT          NOT NULL DEFAULT 0,
  activo           TINYINT(1)   NOT NULL DEFAULT 1,
  creado_en        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_paginas_slug (slug),
  CONSTRAINT fk_paginas_media FOREIGN KEY (imagen_id) REFERENCES media (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Solicitudes recibidas desde el formulario publico
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS solicitudes (
  id             INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nombre         VARCHAR(150) NOT NULL,
  email          VARCHAR(190) NOT NULL,
  telefono       VARCHAR(40)  NOT NULL DEFAULT '',
  empresa        VARCHAR(150) NOT NULL DEFAULT '',
  ciudad         VARCHAR(100) NOT NULL DEFAULT '',
  servicio_id    INT UNSIGNED NULL,
  mensaje        TEXT         NOT NULL,
  estado         ENUM('nueva','en_gestion','atendida','descartada') NOT NULL DEFAULT 'nueva',
  notas          TEXT         NULL,
  ip             VARCHAR(45)  NOT NULL DEFAULT '',
  user_agent     VARCHAR(255) NOT NULL DEFAULT '',
  creado_en      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_solicitudes_estado (estado, creado_en),
  KEY idx_solicitudes_ip (ip, creado_en),
  CONSTRAINT fk_solicitudes_servicio FOREIGN KEY (servicio_id) REFERENCES servicios (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
