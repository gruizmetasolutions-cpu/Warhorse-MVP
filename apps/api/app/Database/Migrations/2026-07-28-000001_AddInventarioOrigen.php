<?php

declare(strict_types=1);

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class AddInventarioOrigen extends Migration
{
    public function up(): void
    {
        try {
            $this->db->query("ALTER TABLE requisiciones DROP CONSTRAINT chk_req_origen");
        } catch (\Throwable $e) {
            try {
                $this->db->query("ALTER TABLE requisiciones DROP CHECK chk_req_origen");
            } catch (\Throwable $e2) {
            }
        }
        $this->db->query("ALTER TABLE requisiciones MODIFY COLUMN origen ENUM('Compra', 'Yonke', 'Inventario') NOT NULL");
        try {
            $this->db->query("ALTER TABLE requisiciones ADD CONSTRAINT chk_req_origen CHECK (
                (origen = 'Yonke' AND unidad_donante_id IS NOT NULL AND numero_factura IS NULL)
                OR (origen = 'Compra' AND unidad_donante_id IS NULL)
                OR (origen = 'Inventario' AND unidad_donante_id IS NULL)
            )");
        } catch (\Throwable $e) {
        }
    }

    public function down(): void
    {
        try {
            $this->db->query("ALTER TABLE requisiciones DROP CONSTRAINT chk_req_origen");
        } catch (\Throwable $e) {
            try {
                $this->db->query("ALTER TABLE requisiciones DROP CHECK chk_req_origen");
            } catch (\Throwable $e2) {
            }
        }
        $this->db->query("ALTER TABLE requisiciones MODIFY COLUMN origen ENUM('Compra', 'Yonke') NOT NULL");
        try {
            $this->db->query("ALTER TABLE requisiciones ADD CONSTRAINT chk_req_origen CHECK (
                (origen = 'Yonke' AND unidad_donante_id IS NOT NULL AND numero_factura IS NULL)
                OR (origen = 'Compra' AND unidad_donante_id IS NULL)
            )");
        } catch (\Throwable $e) {
        }
    }
}
