<?php

declare(strict_types=1);

namespace App\Database\Seeds;

use CodeIgniter\Database\Seeder;

/**
 * Usuarios de dominio (SRS §2.2 + fixtures del demo, doc 09 §5.1).
 * La contraseña real la gestionará Shield (Sprint 1); aquí se siembra un hash
 * bcrypt de la clave de desarrollo "warhorse-demo".
 */
class UsuariosSeeder extends Seeder
{
    public function run(): void
    {
        $hash = password_hash('warhorse-demo', PASSWORD_DEFAULT);

        $usuarios = [
            ['nombre' => 'Dirección WarHorse', 'email' => 'direccion@warhorse.mx', 'rol' => 'admin', 'activo' => 1],
            ['nombre' => 'Edgar Fraga', 'email' => 'edgar@warhorse.mx', 'rol' => 'taller', 'activo' => 1],
            ['nombre' => 'Héctor Ramírez', 'email' => 'hector@warhorse.mx', 'rol' => 'taller', 'activo' => 1],
            ['nombre' => 'Montzay Vázquez', 'email' => 'montzay@warhorse.mx', 'rol' => 'compras', 'activo' => 1],
            ['nombre' => 'Karla Ortiz', 'email' => 'karla@warhorse.mx', 'rol' => 'compras', 'activo' => 0],
            ['nombre' => 'Greisy López', 'email' => 'greisy@warhorse.mx', 'rol' => 'diesel', 'activo' => 1],
        ];

        foreach ($usuarios as $u) {
            $u['password_hash'] = $hash;
            $this->db->table('usuarios')->insert($u);
        }
    }
}
