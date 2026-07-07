<?php

declare(strict_types=1);

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

/**
 * Esquema base de Warhorse — DDL fiel al doc 03 §4 (MySQL 8, InnoDB, utf8mb4).
 * Se usa SQL crudo para conservar CHECKs, columna generada y collation exactos.
 */
class CreateEsquemaBase extends Migration
{
    public function up(): void
    {
        $sentencias = [
            <<<'SQL'
            CREATE TABLE unidades (
                id                      BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
                id_unidad               VARCHAR(20)     NOT NULL,
                tipo                    ENUM('Tractor','Caja','Thermo') NOT NULL,
                estado                  ENUM('Activo','Yonke','Inactivo') NOT NULL DEFAULT 'Activo',
                fecha_alta              DATE            NOT NULL,
                valor_referencia        DECIMAL(12,2)   NULL,
                candidata_reincidencia  BOOLEAN         NOT NULL DEFAULT 0,
                created_at              DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at              DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY (id),
                UNIQUE KEY uk_unidades_id_unidad (id_unidad),
                KEY idx_unidades_estado (estado),
                CONSTRAINT chk_unidades_valor CHECK (valor_referencia IS NULL OR valor_referencia >= 0)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
            SQL,
            <<<'SQL'
            CREATE TABLE usuarios (
                id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
                nombre         VARCHAR(120)    NOT NULL,
                email          VARCHAR(180)    NOT NULL,
                password_hash  VARCHAR(255)    NOT NULL,
                rol            ENUM('admin','taller','compras','diesel') NOT NULL,
                activo         BOOLEAN         NOT NULL DEFAULT 1,
                created_at     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY (id),
                UNIQUE KEY uk_usuarios_email (email),
                KEY idx_usuarios_rol (rol)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
            SQL,
            <<<'SQL'
            CREATE TABLE catalogo_piezas (
                id                  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
                nombre_normalizado  VARCHAR(180)    NOT NULL,
                numero_parte        VARCHAR(80)     NULL,
                precio_referencia   DECIMAL(12,2)   NOT NULL,
                created_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY (id),
                UNIQUE KEY uk_pieza_nombre (nombre_normalizado),
                KEY idx_pieza_numparte (numero_parte),
                CONSTRAINT chk_pieza_precio CHECK (precio_referencia > 0)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
            SQL,
            <<<'SQL'
            CREATE TABLE registros_diesel (
                id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
                unidad_id       BIGINT UNSIGNED NOT NULL,
                fecha           DATE            NOT NULL,
                litros          DECIMAL(10,2)   NOT NULL,
                costo_total     DECIMAL(12,2)   NOT NULL,
                km_recorridos   INT UNSIGNED    NOT NULL,
                foto_ticket_url VARCHAR(255)    NULL,
                capturado_por   BIGINT UNSIGNED NOT NULL,
                created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id),
                KEY idx_diesel_unidad_fecha (unidad_id, fecha),
                CONSTRAINT fk_diesel_unidad   FOREIGN KEY (unidad_id)     REFERENCES unidades(id) ON DELETE RESTRICT,
                CONSTRAINT fk_diesel_usuario  FOREIGN KEY (capturado_por) REFERENCES usuarios(id) ON DELETE RESTRICT,
                CONSTRAINT chk_diesel_litros  CHECK (litros > 0),
                CONSTRAINT chk_diesel_costo   CHECK (costo_total > 0),
                CONSTRAINT chk_diesel_km      CHECK (km_recorridos >= 0)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
            SQL,
            <<<'SQL'
            CREATE TABLE requisiciones (
                id                    BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
                unidad_destino_id     BIGINT UNSIGNED NOT NULL,
                origen                ENUM('Compra','Yonke') NOT NULL,
                unidad_donante_id     BIGINT UNSIGNED NULL,
                pieza_catalogo_id     BIGINT UNSIGNED NULL,
                descripcion_pieza     VARCHAR(180)    NOT NULL,
                numero_parte          VARCHAR(80)     NULL,
                foto_pieza_url        VARCHAR(255)    NOT NULL,
                urgencia              ENUM('Rápida','Media','Crítica') NOT NULL DEFAULT 'Media',
                costo_estimado        DECIMAL(12,2)   NULL,
                origen_costo_estimado ENUM('ultima_compra','catalogo','manual') NULL,
                costo_real            DECIMAL(12,2)   NULL,
                numero_factura        VARCHAR(80)     NULL,
                estado                ENUM('Solicitado','Cotizado','Comprado','Instalado') NOT NULL DEFAULT 'Solicitado',
                fecha_solicitud       DATE            NOT NULL,
                fecha_instalacion     DATE            NULL,
                creado_por            BIGINT UNSIGNED NOT NULL,
                created_at            DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at            DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY (id),
                KEY idx_req_destino (unidad_destino_id),
                KEY idx_req_donante (unidad_donante_id),
                KEY idx_req_estado_urgencia (estado, urgencia),
                CONSTRAINT fk_req_destino  FOREIGN KEY (unidad_destino_id) REFERENCES unidades(id)        ON DELETE RESTRICT,
                CONSTRAINT fk_req_donante  FOREIGN KEY (unidad_donante_id) REFERENCES unidades(id)        ON DELETE RESTRICT,
                CONSTRAINT fk_req_pieza    FOREIGN KEY (pieza_catalogo_id) REFERENCES catalogo_piezas(id) ON DELETE SET NULL,
                CONSTRAINT fk_req_usuario  FOREIGN KEY (creado_por)        REFERENCES usuarios(id)        ON DELETE RESTRICT,
                CONSTRAINT chk_req_yonke_donante CHECK (
                    (origen = 'Yonke' AND unidad_donante_id IS NOT NULL AND numero_factura IS NULL)
                    OR (origen = 'Compra' AND unidad_donante_id IS NULL)
                ),
                CONSTRAINT chk_req_costos CHECK (
                    (costo_estimado IS NULL OR costo_estimado >= 0)
                    AND (costo_real IS NULL OR costo_real >= 0)
                ),
                CONSTRAINT chk_req_origen_costo CHECK (
                    origen_costo_estimado IS NULL OR origen = 'Yonke'
                )
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
            SQL,
            <<<'SQL'
            CREATE TABLE registros_taller (
                id               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
                unidad_id        BIGINT UNSIGNED NOT NULL,
                fecha_ingreso    DATE            NOT NULL,
                fecha_salida     DATE            NULL,
                diagnostico      VARCHAR(255)    NOT NULL,
                criticidad       ENUM('Rápida','Media','Crítico') NOT NULL,
                costo_taller     DECIMAL(12,2)   NOT NULL DEFAULT 0,
                tipo_liberacion  ENUM('Total','Parcial') NULL,
                pendientes       JSON            NULL,
                es_reincidencia  BOOLEAN         NOT NULL DEFAULT 0,
                registrado_por   BIGINT UNSIGNED NOT NULL,
                created_at       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY (id),
                KEY idx_taller_unidad (unidad_id),
                KEY idx_taller_ingreso (fecha_ingreso),
                CONSTRAINT fk_taller_unidad  FOREIGN KEY (unidad_id)      REFERENCES unidades(id) ON DELETE RESTRICT,
                CONSTRAINT fk_taller_usuario FOREIGN KEY (registrado_por) REFERENCES usuarios(id) ON DELETE RESTRICT,
                CONSTRAINT chk_taller_costo  CHECK (costo_taller >= 0),
                CONSTRAINT chk_taller_fechas CHECK (fecha_salida IS NULL OR fecha_salida >= fecha_ingreso),
                CONSTRAINT chk_taller_parcial CHECK (
                    tipo_liberacion <> 'Parcial' OR (pendientes IS NOT NULL AND JSON_LENGTH(pendientes) >= 1)
                )
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
            SQL,
            <<<'SQL'
            CREATE TABLE consolidado_unidad (
                unidad_id            BIGINT UNSIGNED NOT NULL,
                total_diesel         DECIMAL(14,2)   NOT NULL DEFAULT 0,
                total_refacciones    DECIMAL(14,2)   NOT NULL DEFAULT 0,
                total_taller         DECIMAL(14,2)   NOT NULL DEFAULT 0,
                costo_real_acumulado DECIMAL(14,2)   AS (total_diesel + total_refacciones + total_taller) STORED,
                actualizado_en       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY (unidad_id),
                CONSTRAINT fk_consol_unidad FOREIGN KEY (unidad_id) REFERENCES unidades(id) ON DELETE CASCADE,
                CONSTRAINT chk_consol_nonneg CHECK (total_diesel >= 0 AND total_refacciones >= 0 AND total_taller >= 0)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
            SQL,
            <<<'SQL'
            CREATE TABLE alertas_deuda_tecnica (
                id                 BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
                unidad_id          BIGINT UNSIGNED NOT NULL,
                registro_taller_id BIGINT UNSIGNED NOT NULL,
                pendientes         JSON            NOT NULL,
                resuelta           BOOLEAN         NOT NULL DEFAULT 0,
                creada_en          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id),
                KEY idx_alerta_unidad (unidad_id, resuelta),
                CONSTRAINT fk_alerta_unidad FOREIGN KEY (unidad_id)          REFERENCES unidades(id)         ON DELETE CASCADE,
                CONSTRAINT fk_alerta_taller FOREIGN KEY (registro_taller_id) REFERENCES registros_taller(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
            SQL,
            <<<'SQL'
            CREATE TABLE parametros_veredicto (
                id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
                umbral_pct      TINYINT UNSIGNED NOT NULL DEFAULT 40,
                ventana_meses   TINYINT UNSIGNED NOT NULL DEFAULT 12,
                actualizado_en  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                actualizado_por BIGINT UNSIGNED NOT NULL,
                PRIMARY KEY (id),
                CONSTRAINT fk_param_usuario FOREIGN KEY (actualizado_por) REFERENCES usuarios(id) ON DELETE RESTRICT,
                CONSTRAINT chk_param_umbral  CHECK (umbral_pct BETWEEN 20 AND 80),
                CONSTRAINT chk_param_ventana CHECK (ventana_meses BETWEEN 1 AND 36)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
            SQL,
            <<<'SQL'
            CREATE TABLE auditoria (
                id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
                actor_id       BIGINT UNSIGNED NOT NULL,
                accion         VARCHAR(80)     NOT NULL,
                entidad        VARCHAR(60)     NOT NULL,
                entidad_id     BIGINT UNSIGNED NOT NULL,
                valor_anterior JSON            NULL,
                valor_nuevo    JSON            NULL,
                creado_en      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id),
                KEY idx_aud_entidad (entidad, entidad_id),
                KEY idx_aud_actor (actor_id),
                CONSTRAINT fk_aud_actor FOREIGN KEY (actor_id) REFERENCES usuarios(id) ON DELETE RESTRICT
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
            SQL,
        ];

        foreach ($sentencias as $sql) {
            $this->db->query($sql);
        }
    }

    public function down(): void
    {
        // Orden inverso por las FKs
        foreach ([
            'auditoria',
            'parametros_veredicto',
            'alertas_deuda_tecnica',
            'consolidado_unidad',
            'registros_taller',
            'requisiciones',
            'registros_diesel',
            'catalogo_piezas',
            'usuarios',
            'unidades',
        ] as $tabla) {
            $this->db->query("DROP TABLE IF EXISTS {$tabla}");
        }
    }
}
