<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class AddUnidadFields extends Migration
{
    public function up()
    {
        $fields = [
            'vin' => [
                'type'       => 'VARCHAR',
                'constraint' => 255,
                'null'       => true,
            ],
            'numero_economico' => [
                'type'       => 'VARCHAR',
                'constraint' => 255,
                'null'       => true,
            ],
            'marca' => [
                'type'       => 'VARCHAR',
                'constraint' => 255,
                'null'       => true,
            ],
            'modelo' => [
                'type'       => 'VARCHAR',
                'constraint' => 255,
                'null'       => true,
            ],
            'placas' => [
                'type'       => 'VARCHAR',
                'constraint' => 255,
                'null'       => true,
            ],
        ];

        $this->forge->addColumn('unidades', $fields);
    }

    public function down()
    {
        $this->forge->dropColumn('unidades', 'vin');
        $this->forge->dropColumn('unidades', 'numero_economico');
        $this->forge->dropColumn('unidades', 'marca');
        $this->forge->dropColumn('unidades', 'modelo');
        $this->forge->dropColumn('unidades', 'placas');
    }
}
