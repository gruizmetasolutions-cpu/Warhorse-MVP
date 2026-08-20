<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class AddCantidadToRequisiciones extends Migration
{
    public function up(): void
    {
        $this->db->query("ALTER TABLE requisiciones ADD COLUMN cantidad INT UNSIGNED NOT NULL DEFAULT 1 AFTER descripcion_pieza");
    }

    public function down(): void
    {
        $this->db->query("ALTER TABLE requisiciones DROP COLUMN cantidad");
    }
}
