<?php

declare(strict_types=1);

namespace App\Database\Seeds;

use CodeIgniter\Database\Seeder;

/**
 * Seeder maestro (README/CLAUDE: `php spark db:seed InitialSeeder`).
 * Idempotente: limpia las tablas de dominio y vuelve a sembrar.
 */
class InitialSeeder extends Seeder
{
    public function run(): void
    {
        $this->db->query('SET FOREIGN_KEY_CHECKS = 0');
        foreach ([
            'auditoria',
            'alertas_deuda_tecnica',
            'parametros_veredicto',
            'consolidado_unidad',
            'registros_taller',
            'requisiciones',
            'registros_diesel',
            'catalogo_piezas',
            'usuarios',
            'unidades',
            // Identidades Shield (vínculo 1:1 con usuarios)
            'auth_identities',
            'auth_logins',
            'auth_token_logins',
            'auth_remember_tokens',
            'auth_groups_users',
            'auth_permissions_users',
            'users',
        ] as $tabla) {
            $this->db->table($tabla)->truncate();
        }
        $this->db->query('SET FOREIGN_KEY_CHECKS = 1');

        $this->call(UsuariosSeeder::class);
        $this->call(CatalogoPiezasSeeder::class);
        $this->call(ParametrosVeredictoSeeder::class);
        $this->call(DatosDemoSeeder::class);
    }
}
