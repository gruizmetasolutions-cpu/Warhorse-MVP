<?php

declare(strict_types=1);

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

/**
 * Migration representing the new functional upgrades for Warhorse v1.0.
 * Safely adds new columns, alters column definitions (adding 'Servicio' unit type),
 * and creates the quote reversion table.
 */
class UpdateFunctionalSpecs extends Migration
{
    public function up(): void
    {
        // 1. Alter units.tipo enum to add 'Servicio'
        // Using raw sql to modify the enum list safely
        $this->db->query("ALTER TABLE unidades MODIFY COLUMN tipo ENUM('Tractor','Caja','Thermo','Servicio') NOT NULL");

        // 2. Add columns to requisiciones table: origen_refaccion, almacen, numero_serie
        $this->db->query("ALTER TABLE requisiciones ADD COLUMN origen_refaccion VARCHAR(180) NULL AFTER origen");
        $this->db->query("ALTER TABLE requisiciones ADD COLUMN almacen VARCHAR(100) NULL AFTER origen_refaccion");
        $this->db->query("ALTER TABLE requisiciones ADD COLUMN numero_serie VARCHAR(80) NULL AFTER almacen");

        // 3. Update requisiciones.estado ENUM to support extended statuses:
        // Solicitado, En aprobación, En pago, En recolección, Más información, Cancelado, Rechazado, Instalado, Cotizado, Comprado
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
            'Comprado'
        ) NOT NULL DEFAULT 'Solicitado'");

        // 4. Create table reversiones_cotizaciones
        $this->db->query("
            CREATE TABLE reversiones_cotizaciones (
                id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
                requisicion_id BIGINT UNSIGNED NOT NULL,
                revertido_por  BIGINT UNSIGNED NOT NULL,
                fecha_reversion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                motivo         TEXT NOT NULL,
                estado_anterior VARCHAR(50) NOT NULL,
                PRIMARY KEY (id),
                CONSTRAINT fk_reversion_requisicion FOREIGN KEY (requisicion_id) REFERENCES requisiciones(id) ON DELETE CASCADE,
                CONSTRAINT fk_reversion_usuario FOREIGN KEY (revertido_por) REFERENCES usuarios(id) ON DELETE RESTRICT
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");
    }

    public function down(): void
    {
        // Revert table creation
        $this->db->query("DROP TABLE IF EXISTS reversiones_cotizaciones");

        // Revert columns from requisiciones
        $this->db->query("ALTER TABLE requisiciones DROP COLUMN origen_refaccion");
        $this->db->query("ALTER TABLE requisiciones DROP COLUMN almacen");
        $this->db->query("ALTER TABLE requisiciones DROP COLUMN numero_serie");

        // Revert status enum to original
        $this->db->query("ALTER TABLE requisiciones MODIFY COLUMN estado ENUM('Solicitado','Cotizado','Comprado','Instalado') NOT NULL DEFAULT 'Solicitado'");

        // Revert units enum to original
        $this->db->query("ALTER TABLE unidades MODIFY COLUMN tipo ENUM('Tractor','Caja','Thermo') NOT NULL");
    }
}
