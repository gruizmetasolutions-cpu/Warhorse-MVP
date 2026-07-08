<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Database\Seeds\InitialSeeder;
use CodeIgniter\Test\CIUnitTestCase;
use CodeIgniter\Test\DatabaseTestTrait;
use CodeIgniter\Test\FeatureTestTrait;

/**
 * Sprint 5 — doc 06 §2.3 (Diésel).
 */
final class DieselTest extends CIUnitTestCase
{
    use DatabaseTestTrait;
    use FeatureTestTrait;

    protected $migrate     = true;
    protected $migrateOnce = true;
    protected $refresh     = true;
    protected $namespace   = null;
    protected $seed        = InitialSeeder::class;
    protected $seedOnce    = true;

    private static ?string $tokenDiesel = null;
    private static ?string $tokenTaller = null;
    private static ?string $tokenAdmin  = null;

    private function token(string $email): string
    {
        $r = $this->withBodyFormat('json')->post('api/v1/auth/login', ['email' => $email, 'password' => 'warhorse-demo']);
        $r->assertStatus(200);

        return (string) json_decode((string) $r->response()->getBody(), true)['token'];
    }

    private function comoDiesel(): string
    {
        return self::$tokenDiesel ??= $this->token('greisy@warhorse.mx');
    }

    private function comoTaller(): string
    {
        return self::$tokenTaller ??= $this->token('edgar@warhorse.mx');
    }

    private function comoAdmin(): string
    {
        return self::$tokenAdmin ??= $this->token('direccion@warhorse.mx');
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
    private function cargar(array $datos, ?string $token = null): \CodeIgniter\Test\TestResponse
    {
        return $this->withHeaders(['Authorization' => 'Bearer ' . ($token ?? $this->comoDiesel())])
            ->withBodyFormat('json')
            ->post('api/v1/diesel', $datos);
    }

    // ---- doc 06 §2.3 ----

    public function testCargaValidaActualizaConsolidado(): void
    {
        $unidadId = $this->idUnidad('WH101');
        $antes    = $this->consolidadoDiesel($unidadId);

        $r = $this->cargar([
            'unidad_id'     => $unidadId,
            'fecha'         => '2026-07-05',
            'litros'        => 320.5,
            'costo_total'   => 8975.00,
            'km_recorridos' => 410,
        ]);

        $r->assertStatus(201);
        $json = $this->json($r);
        $this->assertSame($unidadId, (int) $json['unidad_id']);
        $this->assertSame(320.5, (float) $json['litros']);

        // RF-DIE-02: el consolidado se actualiza en la misma transacción
        $this->assertSame($antes + 8975.00, $this->consolidadoDiesel($unidadId));
        // RF-INT-05: carga auditada
        $this->seeInDatabase('auditoria', ['entidad' => 'registros_diesel', 'entidad_id' => $json['id'], 'accion' => 'diesel.carga']);
    }

    public function testTextoEnCostoTotalEs422(): void
    {
        $r = $this->cargar([
            'unidad_id'     => $this->idUnidad('WH101'),
            'fecha'         => '2026-07-05',
            'litros'        => 100,
            'costo_total'   => 'tres mil pesos',
            'km_recorridos' => 200,
        ]);

        $r->assertStatus(422);
        $this->assertSame('validation', $this->json($r)['error']);
    }

    public function testLitrosNoPositivosEs422(): void
    {
        foreach ([0, -12.5] as $litros) {
            $this->cargar([
                'unidad_id'     => $this->idUnidad('WH101'),
                'fecha'         => '2026-07-05',
                'litros'        => $litros,
                'costo_total'   => 1000.00,
                'km_recorridos' => 100,
            ])->assertStatus(422);
        }
    }

    public function testUnidadInexistenteEs422SinTransaccionHuerfana(): void
    {
        $this->cargar([
            'unidad_id'     => 99999,
            'fecha'         => '2026-07-05',
            'litros'        => 100,
            'costo_total'   => 2800.00,
            'km_recorridos' => 150,
        ])->assertStatus(422);

        // RF-INT-01: nada quedó escrito
        $this->dontSeeInDatabase('registros_diesel', ['unidad_id' => 99999]);
    }

    public function testCargaPorRolNoDieselEs403(): void
    {
        $datos = [
            'unidad_id'     => $this->idUnidad('WH101'),
            'fecha'         => '2026-07-05',
            'litros'        => 100,
            'costo_total'   => 2800.00,
            'km_recorridos' => 150,
        ];

        $this->cargar($datos, $this->comoTaller())->assertStatus(403);
        // El contrato (doc 05 §10) reserva POST /diesel al rol diesel, ni siquiera admin
        $this->cargar($datos, $this->comoAdmin())->assertStatus(403);
    }

    // ---- GET /diesel (DIE-03) ----

    public function testListadoConFiltrosYPaginacion(): void
    {
        $unidadId = $this->idUnidad('WH101');

        $r = $this->withHeaders(['Authorization' => 'Bearer ' . $this->comoDiesel()])
            ->get("api/v1/diesel?unidad_id={$unidadId}&desde=2026-06-01&hasta=2026-06-30");

        $r->assertStatus(200);
        $json = $this->json($r);
        $this->assertArrayHasKey('meta', $json);
        $this->assertNotSame([], $json['data']);

        foreach ($json['data'] as $carga) {
            $this->assertSame($unidadId, (int) $carga['unidad_id']);
            $this->assertSame('WH101', $carga['id_unidad']);
            $this->assertGreaterThanOrEqual('2026-06-01', $carga['fecha']);
            $this->assertLessThanOrEqual('2026-06-30', $carga['fecha']);
        }
    }

    public function testListadoPermitidoParaAdminYVetadoParaTaller(): void
    {
        $this->withHeaders(['Authorization' => 'Bearer ' . $this->comoAdmin()])
            ->get('api/v1/diesel')->assertStatus(200);

        $this->withHeaders(['Authorization' => 'Bearer ' . $this->comoTaller()])
            ->get('api/v1/diesel')->assertStatus(403);
    }

    private function consolidadoDiesel(int $unidadId): float
    {
        $fila = $this->db->table('consolidado_unidad')->where('unidad_id', $unidadId)->get()->getRowArray();

        return (float) ($fila['total_diesel'] ?? 0);
    }
}
