<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class AddClasificacionReparacionToOT extends Migration
{
    public function up()
    {
        $this->forge->addColumn('ordenes_trabajo', [
            'clasificacion_reparacion' => [
                'type'       => 'ENUM',
                'constraint' => ['Preventivo', 'Correctivo', 'NA'],
                'null'       => false,
                'default'    => 'NA',
            ],
        ]);
    }

    public function down()
    {
        $this->forge->dropColumn('ordenes_trabajo', 'clasificacion_reparacion');
    }
}
