<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class AddTipoToResponsables extends Migration
{
    public function up()
    {
        $this->forge->addColumn('responsables_taller', [
            'tipo' => [
                'type'       => 'ENUM',
                'constraint' => ['Tracto', 'Caja'],
                'null'       => false,
                'default'    => 'Tracto',
                'after'      => 'nombre'
            ],
        ]);
        
        $this->db->query("ALTER TABLE responsables_taller MODIFY COLUMN rol ENUM('Mecánico A', 'Mecánico B', 'Auxiliar', 'Termoquineros') NOT NULL DEFAULT 'Auxiliar'");
    }

    public function down()
    {
        $this->forge->dropColumn('responsables_taller', 'tipo');
    }
}
