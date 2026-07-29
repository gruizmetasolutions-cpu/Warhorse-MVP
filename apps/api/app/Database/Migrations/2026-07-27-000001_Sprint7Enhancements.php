<?php

declare(strict_types=1);

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class Sprint7Enhancements extends Migration
{
    public function up(): void
    {
        // 1. Add columns to catalogo_piezas
        $this->db->query("ALTER TABLE catalogo_piezas ADD COLUMN stock_actual INT UNSIGNED NOT NULL DEFAULT 0 AFTER stock_maximo");
        $this->db->query("ALTER TABLE catalogo_piezas ADD COLUMN validar_limites TINYINT(1) NOT NULL DEFAULT 0 AFTER stock_actual");

        // 2. Add column to unidades
        $this->db->query("ALTER TABLE unidades ADD COLUMN vencimiento_documentacion DATE NULL AFTER valor_referencia");

        // 3. Update requisiciones.urgencia ENUM
        $this->db->query("ALTER TABLE requisiciones MODIFY COLUMN urgencia ENUM('Bajo', 'Medio', 'Crítico', 'Inmediato') NOT NULL DEFAULT 'Medio'");

        // 4. Update requisiciones.estado ENUM
        $this->db->query("ALTER TABLE requisiciones MODIFY COLUMN estado ENUM(
            'Solicitado',
            'En aprobación',
            'En pago',
            'En recolección',
            'Más información',
            'Cancelado',
            'Rechazado',
            'Instalado',
            'Cotizado',
            'Comprado',
            'En trayecto',
            'Bajo pedido'
        ) NOT NULL DEFAULT 'Solicitado'");

        // 5. Create responsables_taller table
        $this->db->query(<<<'SQL'
            CREATE TABLE responsables_taller (
                id      BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
                nombre  VARCHAR(120)    NOT NULL,
                rol     ENUM('Mecánico A', 'Mecánico B', 'Auxiliares', 'Termoquineros', 'Desponchadores') NOT NULL,
                PRIMARY KEY (id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        SQL);

        // 6. Create ordenes_trabajo table
        $this->db->query(<<<'SQL'
            CREATE TABLE ordenes_trabajo (
                id                  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
                unidad_id           BIGINT UNSIGNED NOT NULL,
                responsable_id      BIGINT UNSIGNED NOT NULL,
                diagnostico         TEXT            NOT NULL,
                materiales          JSON            NULL,
                archivos_evidencia  JSON            NULL,
                created_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY (id),
                CONSTRAINT fk_ot_unidad FOREIGN KEY (unidad_id) REFERENCES unidades(id) ON DELETE RESTRICT,
                CONSTRAINT fk_ot_responsable FOREIGN KEY (responsable_id) REFERENCES responsables_taller(id) ON DELETE RESTRICT
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        SQL);

        // 7. Create notificaciones table
        $this->db->query(<<<'SQL'
            CREATE TABLE notificaciones (
                id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
                tipo        VARCHAR(50)     NOT NULL,
                mensaje     TEXT            NOT NULL,
                leida       TINYINT(1)      NOT NULL DEFAULT 0,
                created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        SQL);
    }

    public function down(): void
    {
        $this->db->query("DROP TABLE IF EXISTS notificaciones");
        $this->db->query("DROP TABLE IF EXISTS ordenes_trabajo");
        $this->db->query("DROP TABLE IF EXISTS responsables_taller");

        // Revert enums
        $this->db->query("ALTER TABLE requisiciones MODIFY COLUMN estado ENUM(
            'Solicitado',
            'En aprobación',
            'En pago',
            'En recolección',
            'Más información',
            'Cancelado',
            'Rechazado',
            'Instalado',
            'Cotizado',
            'Comprado',
            'En trayecto'
        ) NOT NULL DEFAULT 'Solicitado'");

        $this->db->query("ALTER TABLE requisiciones MODIFY COLUMN urgencia ENUM('Rápida', 'Media', 'Crítica') NOT NULL DEFAULT 'Media'");

        // Revert columns
        $this->db->query("ALTER TABLE unidades DROP COLUMN vencimiento_documentacion");
        $this->db->query("ALTER TABLE catalogo_piezas DROP COLUMN validar_limites");
        $this->db->query("ALTER TABLE catalogo_piezas DROP COLUMN stock_actual");
    }
}
