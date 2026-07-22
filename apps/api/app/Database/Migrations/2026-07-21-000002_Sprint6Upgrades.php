<?php

declare(strict_types=1);

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

/**
 * Migration for Sprint 6 enhancements (Tickets REQ-001 to REQ-005).
 * Modifies columns, adds stock limits, file uploads, and status options.
 */
class Sprint6Upgrades extends Migration
{
    public function up(): void
    {
        // 1. Alter requisiciones.unidad_destino_id to be NULLable
        $this->db->query("ALTER TABLE requisiciones MODIFY COLUMN unidad_destino_id BIGINT UNSIGNED NULL");

        // 2. Alter requisiciones.descripcion_pieza to be VARCHAR(350)
        $this->db->query("ALTER TABLE requisiciones MODIFY COLUMN descripcion_pieza VARCHAR(350) NOT NULL");

        // 3. Add file upload columns to requisiciones table
        $this->db->query("ALTER TABLE requisiciones ADD COLUMN archivo_cotizacion_url VARCHAR(255) NULL AFTER numero_serie");
        $this->db->query("ALTER TABLE requisiciones ADD COLUMN archivo_factura_url VARCHAR(255) NULL AFTER archivo_cotizacion_url");

        // 4. Update requisiciones.estado ENUM to include 'En trayecto'
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

        // 5. Update unidades.estado ENUM to include 'Vendido'
        $this->db->query("ALTER TABLE unidades MODIFY COLUMN estado ENUM('Activo', 'Yonke', 'Inactivo', 'Vendido') NOT NULL DEFAULT 'Activo'");

        // 6. Add stock limits columns to catalogo_piezas table
        $this->db->query("ALTER TABLE catalogo_piezas ADD COLUMN stock_minimo INT UNSIGNED NULL AFTER precio_referencia");
        $this->db->query("ALTER TABLE catalogo_piezas ADD COLUMN stock_maximo INT UNSIGNED NULL AFTER stock_minimo");
    }

    public function down(): void
    {
        // Revert stock limits columns
        $this->db->query("ALTER TABLE catalogo_piezas DROP COLUMN stock_minimo");
        $this->db->query("ALTER TABLE catalogo_piezas DROP COLUMN stock_maximo");

        // Revert unidades.estado ENUM
        $this->db->query("ALTER TABLE unidades MODIFY COLUMN estado ENUM('Activo', 'Yonke', 'Inactivo') NOT NULL DEFAULT 'Activo'");

        // Revert requisiciones.estado ENUM
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

        // Revert file upload columns
        $this->db->query("ALTER TABLE requisiciones DROP COLUMN archivo_cotizacion_url");
        $this->db->query("ALTER TABLE requisiciones DROP COLUMN archivo_factura_url");

        // Revert requisiciones.descripcion_pieza VARCHAR size
        $this->db->query("ALTER TABLE requisiciones MODIFY COLUMN descripcion_pieza VARCHAR(180) NOT NULL");

        // Revert requisiciones.unidad_destino_id NULLable (must be NOT NULL, but wait - if there are null values it will fail, so be careful during rollback)
        $this->db->query("ALTER TABLE requisiciones MODIFY COLUMN unidad_destino_id BIGINT UNSIGNED NOT NULL");
    }
}
