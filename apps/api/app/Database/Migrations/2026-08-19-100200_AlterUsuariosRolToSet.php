<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class AlterUsuariosRolToSet extends Migration
{
    public function up()
    {
        $this->db->query("ALTER TABLE usuarios MODIFY COLUMN rol SET('admin','taller','compras','diesel') NOT NULL");
    }

    public function down()
    {
        // En un rollback perdemos info de los roles mAoltibles
        $this->db->query("ALTER TABLE usuarios MODIFY COLUMN rol ENUM('admin','taller','compras','diesel') NOT NULL");
    }
}
