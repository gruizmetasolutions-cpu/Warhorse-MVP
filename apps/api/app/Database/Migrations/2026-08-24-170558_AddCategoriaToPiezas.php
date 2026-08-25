<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class AddCategoriaToPiezas extends Migration
{
    public function up()
    {
        $this->forge->addColumn('catalogo_piezas', [
            'categoria' => [
                'type'       => 'VARCHAR',
                'constraint' => 100,
                'null'       => false,
                'default'    => 'Preventivos',
                'after'      => 'nombre_normalizado'
            ],
        ]);
    }

    public function down()
    {
        $this->forge->dropColumn('catalogo_piezas', 'categoria');
    }
}
