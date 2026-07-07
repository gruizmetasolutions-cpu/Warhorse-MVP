<?php

declare(strict_types=1);

namespace App\Database\Seeds;

use App\Services\CuentaService;
use CodeIgniter\Database\Seeder;

/**
 * Usuarios de dominio + identidades Shield (vínculo 1:1 por email).
 * Contraseña de desarrollo: "warhorse-demo".
 */
class UsuariosSeeder extends Seeder
{
    public function run(): void
    {
        $cuentas = new CuentaService();

        $usuarios = [
            ['nombre' => 'Dirección WarHorse', 'email' => 'direccion@warhorse.mx', 'rol' => 'admin', 'activo' => 1],
            ['nombre' => 'Edgar Fraga', 'email' => 'edgar@warhorse.mx', 'rol' => 'taller', 'activo' => 1],
            ['nombre' => 'Héctor Ramírez', 'email' => 'hector@warhorse.mx', 'rol' => 'taller', 'activo' => 1],
            ['nombre' => 'Montzay Vázquez', 'email' => 'montzay@warhorse.mx', 'rol' => 'compras', 'activo' => 1],
            ['nombre' => 'Karla Ortiz', 'email' => 'karla@warhorse.mx', 'rol' => 'compras', 'activo' => 0],
            ['nombre' => 'Greisy López', 'email' => 'greisy@warhorse.mx', 'rol' => 'diesel', 'activo' => 1],
        ];

        foreach ($usuarios as $u) {
            $cuentas->crear($u, 'warhorse-demo');
        }
    }
}
