<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class AddOperacionToUnidades extends Migration
{
    public function up()
    {
        $this->forge->addColumn('unidades', [
            'operacion' => [
                'type'       => 'VARCHAR',
                'constraint' => 50,
                'null'       => true,
                'after'      => 'tipo',
            ],
        ]);
    }

    public function down()
    {
        $this->forge->dropColumn('unidades', 'operacion');
    }
}
