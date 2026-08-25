<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class AddAprobadoPorToRequisiciones extends Migration
{
    public function up()
    {
        $this->db->query("ALTER TABLE requisiciones ADD COLUMN aprobado_por BIGINT UNSIGNED NULL AFTER creado_por");
        $this->db->query("ALTER TABLE requisiciones ADD CONSTRAINT fk_req_aprobado_por FOREIGN KEY (aprobado_por) REFERENCES usuarios(id) ON DELETE SET NULL");
    }

    public function down()
    {
        $this->db->query("ALTER TABLE requisiciones DROP FOREIGN KEY fk_req_aprobado_por");
        $this->db->query("ALTER TABLE requisiciones DROP COLUMN aprobado_por");
    }
}
