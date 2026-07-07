<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Database\Seeds\InitialSeeder;
use CodeIgniter\Test\CIUnitTestCase;
use CodeIgniter\Test\DatabaseTestTrait;
use CodeIgniter\Test\FeatureTestTrait;

/**
 * Sprint 4 — doc 06 §2.5 (Taller) y §2.9 (máquina de estados de Taller).
 */
final class TallerTest extends CIUnitTestCase
{
    use DatabaseTestTrait;
    use FeatureTestTrait;

    protected $migrate     = true;
    protected $migrateOnce = true;
    protected $refresh     = true;
    protected $namespace   = null;
    protected $seed        = InitialSeeder::class;
    protected $seedOnce    = true;

    private static ?string $tokenTaller  = null;
    private static ?string $tokenCompras = null;

    private function token(string $email): string
    {
        $r = $this->withBodyFormat('json')->post('api/v1/auth/login', ['email' => $email, 'password' => 'warhorse-demo']);
        $r->assertStatus(200);

        return (string) json_decode((string) $r->response()->getBody(), true)['token'];
    }

    private function comoTaller(): string
    {
        return self::$tokenTaller ??= $this->token('edgar@warhorse.mx');
    }

    private function comoCompras(): string
    {
        return self::$tokenCompras ??= $this->token('montzay@warhorse.mx');
    }

    /**
     * @return array<string, mixed>
     */
    private function json(\CodeIgniter\Test\TestResponse $r): array
    {
        return (array) json_decode((string) $r->response()->getBody(), true);
    }

    private function idUnidad(string $idUnidad): int
    {
        $fila = $this->db->table('unidades')->where('id_unidad', $idUnidad)->get()->getRowArray();
        $this->assertIsArray($fila);

        return (int) $fila['id'];
    }

    /**
     * @param array<string, mixed> $datos
     */
    private function ingresar(array $datos, ?string $token = null): \CodeIgniter\Test\TestResponse
    {
        return $this->withHeaders(['Authorization' => 'Bearer ' . ($token ?? $this->comoTaller())])
            ->withBodyFormat('json')
            ->post('api/v1/taller', $datos);
    }

    /**
     * @param array<string, mixed> $datos
     */
    private function liberar(int $id, array $datos): \CodeIgniter\Test\TestResponse
    {
        return $this->withHeaders(['Authorization' => 'Bearer ' . $this->comoTaller()])
            ->withBodyFormat('json')
            ->patch("api/v1/taller/{$id}/liberar", $datos);
    }

    // ---- doc 06 §2.5 ----

    public function testIngresoValidoQuedaEnTaller(): void
    {
        $r = $this->ingresar([
            'unidad_id'     => $this->idUnidad('WH210'),
            'fecha_ingreso' => '2026-07-02',
            'diagnostico'   => 'Frenos traseros',
            'criticidad'    => 'Media',
        ]);

        $r->assertStatus(201);
        $json = $this->json($r);
        $this->assertNull($json['tipo_liberacion']);
        $this->assertNull($json['fecha_salida']);
    }

    public function testIngresoConUnidadInexistenteEs422(): void
    {
        $this->ingresar([
            'unidad_id'     => 99999,
            'fecha_ingreso' => '2026-07-02',
            'diagnostico'   => 'Frenos',
            'criticidad'    => 'Media',
        ])->assertStatus(422);
    }

    public function testIngresoPorRolComprasEs403(): void
    {
        $this->ingresar([
            'unidad_id'     => $this->idUnidad('WH210'),
            'fecha_ingreso' => '2026-07-02',
            'diagnostico'   => 'Frenos',
            'criticidad'    => 'Media',
        ], $this->comoCompras())->assertStatus(403);
    }

    public function testLiberacionTotalSumaAlConsolidado(): void
    {
        $unidadId = $this->idUnidad('WH210');
        $antes    = $this->consolidadoTaller($unidadId);

        $id = $this->json($this->ingresar([
            'unidad_id' => $unidadId, 'fecha_ingreso' => '2026-07-02', 'diagnostico' => 'Suspensión', 'criticidad' => 'Media',
        ]))['id'];

        $this->liberar((int) $id, [
            'tipo_liberacion' => 'Total',
            'fecha_salida'    => '2026-07-04',
            'costo_taller'    => 3800.00,
        ])->assertStatus(200);

        $this->assertSame($antes + 3800.00, $this->consolidadoTaller($unidadId));
        $this->seeInDatabase('auditoria', ['entidad' => 'registros_taller', 'entidad_id' => $id, 'accion' => 'taller.liberada']);
    }

    public function testLiberacionParcialGeneraAlertaYMarcaCandidata(): void
    {
        $unidadId = $this->idUnidad('WH104');

        $id = $this->json($this->ingresar([
            'unidad_id' => $unidadId, 'fecha_ingreso' => '2026-07-02', 'diagnostico' => 'Fuga de aire', 'criticidad' => 'Crítico',
        ]))['id'];

        $r = $this->liberar((int) $id, [
            'tipo_liberacion' => 'Parcial',
            'fecha_salida'    => '2026-07-03',
            'costo_taller'    => 1500.00,
            'pendientes'      => ['Cambio de manguera principal', 'Revisión de compresor'],
        ]);
        $r->assertStatus(200);

        // Alerta de deuda técnica (RF-TAL-04)
        $this->seeInDatabase('alertas_deuda_tecnica', ['registro_taller_id' => $id, 'resuelta' => 0]);
        // Unidad marcada candidata a reincidencia
        $this->seeInDatabase('unidades', ['id' => $unidadId, 'candidata_reincidencia' => 1]);
        // Auditada (RF-INT-05)
        $this->seeInDatabase('auditoria', ['entidad' => 'registros_taller', 'entidad_id' => $id, 'accion' => 'taller.liberacion_parcial']);
    }

    public function testLiberacionParcialSinPendientesEs422(): void
    {
        $id = $this->json($this->ingresar([
            'unidad_id' => $this->idUnidad('WH210'), 'fecha_ingreso' => '2026-07-02', 'diagnostico' => 'Luces', 'criticidad' => 'Rápida',
        ]))['id'];

        $r = $this->liberar((int) $id, [
            'tipo_liberacion' => 'Parcial',
            'fecha_salida'    => '2026-07-03',
            'costo_taller'    => 100.00,
        ]);
        $r->assertStatus(422);
    }

    public function testReingresoPorMismaFallaTrasMejoralitoEsReincidencia(): void
    {
        $unidadId = $this->idUnidad('WH101');

        // Mejoralito por "Fuga de aceite"
        $primero = $this->json($this->ingresar([
            'unidad_id' => $unidadId, 'fecha_ingreso' => '2026-07-01', 'diagnostico' => 'Fuga de aceite', 'criticidad' => 'Media',
        ]))['id'];
        $this->liberar((int) $primero, [
            'tipo_liberacion' => 'Parcial', 'fecha_salida' => '2026-07-02', 'costo_taller' => 900.00,
            'pendientes'      => ['Retén definitivo'],
        ])->assertStatus(200);

        // Reingreso por la MISMA falla → es_reincidencia = 1
        $r = $this->ingresar([
            'unidad_id' => $unidadId, 'fecha_ingreso' => '2026-07-05', 'diagnostico' => 'fuga de aceite', 'criticidad' => 'Crítico',
        ]);
        $r->assertStatus(201);
        $this->assertTrue((bool) $this->json($r)['es_reincidencia']);

        // Un diagnóstico distinto NO es reincidencia
        $otro = $this->ingresar([
            'unidad_id' => $unidadId, 'fecha_ingreso' => '2026-07-06', 'diagnostico' => 'Clutch duro', 'criticidad' => 'Media',
        ]);
        $this->assertFalse((bool) $this->json($otro)['es_reincidencia']);
    }

    // ---- doc 06 §2.9: máquina exhaustiva ----

    public function testLiberarDosVecesEs409(): void
    {
        foreach (['Total', 'Parcial'] as $primera) {
            $id = $this->json($this->ingresar([
                'unidad_id' => $this->idUnidad('WH118'), 'fecha_ingreso' => '2026-07-01', 'diagnostico' => 'Prueba ' . $primera, 'criticidad' => 'Media',
            ]))['id'];

            $datos = [
                'tipo_liberacion' => $primera, 'fecha_salida' => '2026-07-02', 'costo_taller' => 100.00,
            ];
            if ($primera === 'Parcial') {
                $datos['pendientes'] = ['Algo pendiente'];
            }
            $this->liberar((int) $id, $datos)->assertStatus(200);

            // Desde Liberado (cualquiera), toda liberación posterior es ilegal
            $this->liberar((int) $id, [
                'tipo_liberacion' => 'Total', 'fecha_salida' => '2026-07-03', 'costo_taller' => 50.00,
            ])->assertStatus(409);
        }
    }

    public function testLiberarRegistroInexistenteEs404(): void
    {
        $this->liberar(99999, ['tipo_liberacion' => 'Total', 'fecha_salida' => '2026-07-03', 'costo_taller' => 1])
            ->assertStatus(404);
    }

    public function testListadoDeTallerConDiasDerivados(): void
    {
        $r = $this->withHeaders(['Authorization' => 'Bearer ' . $this->comoTaller()])
            ->get('api/v1/taller');
        $r->assertStatus(200);
        $data = $this->json($r)['data'];
        $this->assertNotSame([], $data);
        $conSalida = array_values(array_filter($data, static fn (array $t): bool => $t['fecha_salida'] !== null));
        $this->assertArrayHasKey('dias_en_taller', $conSalida[0]);
        $this->assertArrayHasKey('id_unidad', $conSalida[0]);
    }

    private function consolidadoTaller(int $unidadId): float
    {
        $fila = $this->db->table('consolidado_unidad')->where('unidad_id', $unidadId)->get()->getRowArray();

        return (float) ($fila['total_taller'] ?? 0);
    }
}
