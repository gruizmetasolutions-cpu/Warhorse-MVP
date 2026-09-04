<?php

declare(strict_types=1);

namespace App\Database\Seeds;

use CodeIgniter\Database\Seeder;

/**
 * Seeder de Estado Cero para Pruebas E2E de Flujo Completo:
 * - Conserva únicamente los catálogos maestros (Unidades, Usuarios/Shield, Catálogo de Piezas, Parámetros).
 * - Deja en CERO absoluto todas las tablas transaccionales y operativas:
 *   * 0 registros_taller (Órdenes de Trabajo)
 *   * 0 requisiciones (Compras y Solicitudes)
 *   * 0 registros_diesel (Cargas de combustible)
 *   * 0 alertas_deuda_tecnica (Alertas)
 *   * 0 auditoria (Bitácora de cambios)
 *   * consolidado_unidad en $0.00 para todas las unidades
 */
class ResetLimpioSeeder extends Seeder
{
    public function run(): void
    {
        $this->db->query('SET FOREIGN_KEY_CHECKS = 0');

        $tablas = [
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
            // Tablas de Shield
            'auth_identities',
            'auth_logins',
            'auth_token_logins',
            'auth_remember_tokens',
            'auth_groups_users',
            'auth_permissions_users',
            'users',
        ];

        foreach ($tablas as $tabla) {
            $this->db->table($tabla)->truncate();
        }

        $this->db->query('SET FOREIGN_KEY_CHECKS = 1');

        // 1. Sembrar Catálogo de Usuarios y Roles
        $this->call(UsuariosSeeder::class);

        // 2. Sembrar Catálogo Maestro de Refacciones
        $this->call(CatalogoPiezasSeeder::class);

        // 3. Sembrar Parámetros de Veredicto
        $this->call(ParametrosVeredictoSeeder::class);

        // 3.1. Sembrar Catálogo Maestro de Responsables de Taller
        $this->call(ResponsablesTallerSeeder::class);

        // 4. Sembrar Catálogo Maestro de Unidades (Sin historial operativo previo)
        $unidades = [
            ['id_unidad' => 'WH101', 'tipo' => 'Tractor', 'estado' => 'Activo', 'fecha_alta' => '2021-03-15', 'valor_referencia' => 480000.00, 'candidata_reincidencia' => 0],
            ['id_unidad' => 'WH104', 'tipo' => 'Tractor', 'estado' => 'Activo', 'fecha_alta' => '2021-08-02', 'valor_referencia' => 520000.00, 'candidata_reincidencia' => 0],
            ['id_unidad' => 'WH118', 'tipo' => 'Tractor', 'estado' => 'Activo', 'fecha_alta' => '2019-11-20', 'valor_referencia' => 350000.00, 'candidata_reincidencia' => 0],
            ['id_unidad' => 'WH125', 'tipo' => 'Tractor', 'estado' => 'Activo', 'fecha_alta' => '2017-06-10', 'valor_referencia' => 210000.00, 'candidata_reincidencia' => 0],
            ['id_unidad' => 'WH210', 'tipo' => 'Tractor', 'estado' => 'Activo', 'fecha_alta' => '2023-01-25', 'valor_referencia' => 610000.00, 'candidata_reincidencia' => 0],
            ['id_unidad' => 'WH03',  'tipo' => 'Tractor', 'estado' => 'Yonke',  'fecha_alta' => '2012-04-01', 'valor_referencia' => null,      'candidata_reincidencia' => 0],
            ['id_unidad' => 'WH60',  'tipo' => 'Tractor', 'estado' => 'Yonke',  'fecha_alta' => '2014-09-18', 'valor_referencia' => null,      'candidata_reincidencia' => 0],
            ['id_unidad' => 'CJ12',  'tipo' => 'Caja',    'estado' => 'Activo', 'fecha_alta' => '2020-02-12', 'valor_referencia' => 180000.00, 'candidata_reincidencia' => 0],
            ['id_unidad' => 'CJ07',  'tipo' => 'Caja',    'estado' => 'Inactivo','fecha_alta' => '2015-07-30', 'valor_referencia' => 90000.00,  'candidata_reincidencia' => 0],
        ];

        $this->db->table('unidades')->insertBatch($unidades);

        // 5. Inicializar Consolidado de Gastos en $0.00 para todas las unidades
        $resultado = $this->db->table('unidades')->get();
        if ($resultado instanceof \CodeIgniter\Database\ResultInterface) {
            foreach ($resultado->getResultArray() as $u) {
                $this->db->table('consolidado_unidad')->insert([
                    'unidad_id'         => (int) $u['id'],
                    'total_diesel'      => 0.00,
                    'total_refacciones' => 0.00,
                    'total_taller'      => 0.00,
                ]);
            }
        }
    }
}
