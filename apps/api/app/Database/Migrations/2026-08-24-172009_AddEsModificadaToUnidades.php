<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class AddEsModificadaToUnidades extends Migration
{
    public function up()
    {
        $this->forge->addColumn('unidades', [
            'es_modificada' => [
                'type'       => 'BOOLEAN',
                'null'       => false,
                'default'    => false,
            ],
        ]);
    }

    public function down()
    {
        $this->forge->dropColumn('unidades', 'es_modificada');
    }
}
