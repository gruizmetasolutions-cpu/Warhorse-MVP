<?php

declare(strict_types=1);

namespace App\Database\Seeds;

use CodeIgniter\Database\Seeder;

/**
 * Parámetros del veredicto (doc 03): umbral 40% / ventana 12 meses,
 * coherentes con el `umbralVender` del demo validado.
 */
class ParametrosVeredictoSeeder extends Seeder
{
    public function run(): void
    {
        $resultado = $this->db->table('usuarios')->where('rol', 'admin')->get();
        $admin     = $resultado instanceof \CodeIgniter\Database\ResultInterface
            ? $resultado->getRowArray()
            : null;
        if (! is_array($admin) || ! isset($admin['id'])) {
            throw new \RuntimeException('Corre UsuariosSeeder antes de ParametrosVeredictoSeeder.');
        }

        $this->db->table('parametros_veredicto')->insert([
            'umbral_pct'      => 40,
            'ventana_meses'   => 12,
            'actualizado_por' => (int) $admin['id'],
        ]);
    }
}
