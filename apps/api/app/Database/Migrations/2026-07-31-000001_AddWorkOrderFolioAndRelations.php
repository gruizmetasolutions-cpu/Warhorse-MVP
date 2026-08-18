<?php

declare(strict_types=1);

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class AddWorkOrderFolioAndRelations extends Migration
{
    public function up(): void
    {
        // 1. Add columns to ordenes_trabajo
        $this->db->query("ALTER TABLE ordenes_trabajo ADD COLUMN folio VARCHAR(30) UNIQUE NULL AFTER id");
        $this->db->query("ALTER TABLE ordenes_trabajo ADD COLUMN categoria ENUM('Preventivo', 'Correctivo', 'Mantenimiento') NOT NULL DEFAULT 'Mantenimiento' AFTER responsable_id");
        $this->db->query("ALTER TABLE ordenes_trabajo ADD COLUMN estado ENUM('Activa', 'Cerrada', 'Cancelada') NOT NULL DEFAULT 'Activa' AFTER archivos_evidencia");

        // 2. Populate folio for any existing rows
        $this->db->query("UPDATE ordenes_trabajo SET folio = CONCAT('OT-', LPAD(id, 5, '0')) WHERE folio IS NULL");

        // 3. Add columns to requisiciones and registros_taller
        $this->db->query("ALTER TABLE requisiciones ADD COLUMN orden_trabajo_id BIGINT UNSIGNED NULL AFTER pieza_catalogo_id");
        $this->db->query("ALTER TABLE requisiciones ADD COLUMN stock_descontado TINYINT(1) NOT NULL DEFAULT 0 AFTER costo_real");
        $this->db->query("ALTER TABLE registros_taller ADD COLUMN orden_trabajo_id BIGINT UNSIGNED NULL AFTER unidad_id");

        // 4. Add constraints
        $this->db->query("ALTER TABLE requisiciones ADD CONSTRAINT fk_req_orden_trabajo FOREIGN KEY (orden_trabajo_id) REFERENCES ordenes_trabajo(id) ON DELETE RESTRICT");
        $this->db->query("ALTER TABLE registros_taller ADD CONSTRAINT fk_taller_orden_trabajo FOREIGN KEY (orden_trabajo_id) REFERENCES ordenes_trabajo(id) ON DELETE RESTRICT");
    }

    public function down(): void
    {
        // 1. Remove constraint and columns from requisiciones and registros_taller
        try {
            $this->db->query("ALTER TABLE requisiciones DROP FOREIGN KEY fk_req_orden_trabajo");
        } catch (\Throwable $e) {}
        try {
            $this->db->query("ALTER TABLE registros_taller DROP FOREIGN KEY fk_taller_orden_trabajo");
        } catch (\Throwable $e) {}
        
        $this->db->query("ALTER TABLE requisiciones DROP COLUMN orden_trabajo_id");
        $this->db->query("ALTER TABLE requisiciones DROP COLUMN stock_descontado");
        $this->db->query("ALTER TABLE registros_taller DROP COLUMN orden_trabajo_id");

        // 2. Remove columns from ordenes_trabajo
        $this->db->query("ALTER TABLE ordenes_trabajo DROP COLUMN folio");
        $this->db->query("ALTER TABLE ordenes_trabajo DROP COLUMN categoria");
        $this->db->query("ALTER TABLE ordenes_trabajo DROP COLUMN estado");
    }
}
