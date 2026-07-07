<?php

declare(strict_types=1);

namespace Tests\Database;

use CodeIgniter\Test\CIUnitTestCase;
use CodeIgniter\Test\DatabaseTestTrait;

/**
 * Smoke del esquema (Sprint 0): las migraciones completas (App + Shield +
 * Settings + Queue) corren limpias contra la BD de pruebas (MariaDB 11.8,
 * misma versión que el servidor real) y las invariantes viven en la BD.
 */
final class EsquemaTest extends CIUnitTestCase
{
    use DatabaseTestTrait;

    protected $migrate     = true;
    protected $migrateOnce = true;
    protected $refresh     = true;
    protected $namespace   = null; // todas las migraciones (App + vendor)

    public function testLasTablasDelDominioExisten(): void
    {
        $tablas = [
            'unidades',
            'usuarios',
            'catalogo_piezas',
            'registros_diesel',
            'requisiciones',
            'registros_taller',
            'consolidado_unidad',
            'alertas_deuda_tecnica',
            'parametros_veredicto',
            'auditoria',
        ];

        foreach ($tablas as $tabla) {
            // sin caché: la lista de tablas se cachea antes de correr las migraciones
            $this->assertTrue($this->db->tableExists($tabla, false), "Falta la tabla {$tabla}");
        }
    }

    public function testColumnaGeneradaDelConsolidadoSuma(): void
    {
        $this->db->table('unidades')->insert([
            'id_unidad'  => 'TST01',
            'tipo'       => 'Tractor',
            'estado'     => 'Activo',
            'fecha_alta' => '2026-01-01',
        ]);
        $unidadId = (int) $this->db->insertID();

        $this->db->table('consolidado_unidad')->insert([
            'unidad_id'         => $unidadId,
            'total_diesel'      => 100.00,
            'total_refacciones' => 200.50,
            'total_taller'      => 50.25,
        ]);

        $fila = $this->db->table('consolidado_unidad')
            ->where('unidad_id', $unidadId)
            ->get()
            ->getRowArray();

        $this->assertIsArray($fila);
        $this->assertSame('350.75', (string) $fila['costo_real_acumulado']);
    }

    public function testElCheckDeYonkeConFacturaEsRechazadoPorLaBd(): void
    {
        $this->db->table('unidades')->insert([
            'id_unidad'  => 'TST02',
            'tipo'       => 'Tractor',
            'estado'     => 'Yonke',
            'fecha_alta' => '2026-01-01',
        ]);
        $unidadId = (int) $this->db->insertID();

        $this->db->table('usuarios')->insert([
            'nombre'        => 'Probador',
            'email'         => 'probador@test.mx',
            'password_hash' => 'x',
            'rol'           => 'taller',
        ]);
        $usuarioId = (int) $this->db->insertID();

        $this->expectException(\CodeIgniter\Database\Exceptions\DatabaseException::class);

        // Invariante RF-INT-03: una requisición Yonke no puede llevar factura
        $this->db->table('requisiciones')->insert([
            'unidad_destino_id' => $unidadId,
            'origen'            => 'Yonke',
            'unidad_donante_id' => $unidadId,
            'descripcion_pieza' => 'Pieza inválida',
            'foto_pieza_url'    => 'x.jpg',
            'fecha_solicitud'   => '2026-01-01',
            'creado_por'        => $usuarioId,
            'numero_factura'    => 'F-ILEGAL',
        ]);
    }
}
