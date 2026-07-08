<?php

declare(strict_types=1);

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

/**
 * Alta de usuario sin correo: la contraseña inicial es temporal y el usuario
 * debe definir la suya en el primer login. Esta bandera marca esa obligación.
 */
class DebeCambiarPassword extends Migration
{
    public function up(): void
    {
        $this->forge->addColumn('usuarios', [
            'debe_cambiar_password' => [
                'type'       => 'TINYINT',
                'constraint' => 1,
                'null'       => false,
                'default'    => 0,
                'after'      => 'activo',
            ],
        ]);
    }

    public function down(): void
    {
        $this->forge->dropColumn('usuarios', 'debe_cambiar_password');
    }
}
