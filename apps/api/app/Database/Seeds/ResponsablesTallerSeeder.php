<?php

declare(strict_types=1);

namespace App\Database\Seeds;

use CodeIgniter\Database\Seeder;

class ResponsablesTallerSeeder extends Seeder
{
    public function run(): void
    {
        $db = \Config\Database::connect();
        
        $responsables = [
            ['id' => 1, 'nombre' => 'Carlos Méndez', 'rol' => 'Mecánico A'],
            ['id' => 2, 'nombre' => 'Luis Morales', 'rol' => 'Mecánico B'],
            ['id' => 3, 'nombre' => 'Héctor Gómez', 'rol' => 'Auxiliar'],
            ['id' => 4, 'nombre' => 'Roberto Silva', 'rol' => 'Termoquineros'],
        ];

        foreach ($responsables as $resp) {
            $existe = $db->table('responsables_taller')->where('id', $resp['id'])->countAllResults();
            if ($existe === 0) {
                $db->table('responsables_taller')->insert($resp);
            }
        }
    }
}
