<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Database\Seeds\InitialSeeder;
use CodeIgniter\Test\CIUnitTestCase;
use CodeIgniter\Test\DatabaseTestTrait;
use CodeIgniter\Test\FeatureTestTrait;

/**
 * Sprint 2 — doc 06 §2.2 (Unidades) y §2.8 (máquina de estados exhaustiva).
 */
final class UnidadesTest extends CIUnitTestCase
{
    use DatabaseTestTrait;
    use FeatureTestTrait;

    protected $migrate     = true;
    protected $migrateOnce = true;
    protected $refresh     = true;
    protected $namespace   = null;
    protected $seed        = InitialSeeder::class;
    protected $seedOnce    = true;

    private static ?string $tokenAdmin  = null;
    private static ?string $tokenTaller = null;

    private function token(string $email): string
    {
        $respuesta = $this->withBodyFormat('json')->post('api/v1/auth/login', [
            'email'    => $email,
            'password' => 'warhorse-demo',
        ]);
        $respuesta->assertStatus(200);
        $json = json_decode((string) $respuesta->response()->getBody(), true);

        return (string) $json['token'];
    }

    private function comoAdmin(): string
    {
        return self::$tokenAdmin ??= $this->token('direccion@warhorse.mx');
    }

    private function comoTaller(): string
    {
        return self::$tokenTaller ??= $this->token('edgar@warhorse.mx');
    }

    /**
     * @param array<string, mixed> $cuerpo
     */
    private function post_(string $ruta, array $cuerpo, string $token): \CodeIgniter\Test\TestResponse
    {
        return $this->withHeaders(['Authorization' => "Bearer {$token}"])
            ->withBodyFormat('json')
            ->post($ruta, $cuerpo);
    }

    /**
     * @param array<string, mixed> $cuerpo
     */
    private function patch_(string $ruta, array $cuerpo, string $token): \CodeIgniter\Test\TestResponse
    {
        return $this->withHeaders(['Authorization' => "Bearer {$token}"])
            ->withBodyFormat('json')
            ->patch($ruta, $cuerpo);
    }

    /**
     * @return array<string, mixed>
     */
    private function json(\CodeIgniter\Test\TestResponse $respuesta): array
    {
        return (array) json_decode((string) $respuesta->response()->getBody(), true);
    }

    // ---- doc 06 §2.2 ----

    public function testListadoPaginadoYFiltroPorEstado(): void
    {
        $respuesta = $this->withHeaders(['Authorization' => 'Bearer ' . $this->comoAdmin()])
            ->get('api/v1/unidades');
        $respuesta->assertStatus(200);
        $json = $this->json($respuesta);
        $this->assertSame(9, $json['meta']['total']);
        $this->assertCount(9, $json['data']);

        $yonke = $this->json(
            $this->withHeaders(['Authorization' => 'Bearer ' . $this->comoAdmin()])
                ->get('api/v1/unidades?estado=Yonke'),
        );
        $ids = array_column($yonke['data'], 'id_unidad');
        sort($ids);
        $this->assertSame(['WH03', 'WH60'], $ids);
    }

    public function testAltaValidaCreaConsolidadoYAudita(): void
    {
        $respuesta = $this->post_('api/v1/unidades', [
            'id_unidad'        => 'WH130',
            'tipo'             => 'Tractor',
            'estado'           => 'Activo',
            'fecha_alta'       => '2026-07-01',
            'valor_referencia' => 700000.00,
        ], $this->comoAdmin());

        $respuesta->assertStatus(201);
        $json = $this->json($respuesta);
        $this->assertSame('WH130', $json['id_unidad']);
        $this->assertSame(0.0, (float) $json['costo_real_acumulado']);

        // Fila 1:1 del consolidado (doc 03 §5)
        $this->seeInDatabase('consolidado_unidad', ['unidad_id' => $json['id']]);
        // Alta auditada
        $this->seeInDatabase('auditoria', ['entidad' => 'unidades', 'entidad_id' => $json['id'], 'accion' => 'unidad.alta']);
    }

    public function testAltaDuplicadaEs409(): void
    {
        $this->post_('api/v1/unidades', [
            'id_unidad' => 'WH125', 'tipo' => 'Tractor', 'fecha_alta' => '2026-07-01',
        ], $this->comoAdmin())->assertStatus(409);
    }

    public function testAltaPorRolNoAdminEs403(): void
    {
        $this->post_('api/v1/unidades', [
            'id_unidad' => 'WH131', 'tipo' => 'Tractor', 'fecha_alta' => '2026-07-01',
        ], $this->comoTaller())->assertStatus(403);
    }

    public function testValorReferenciaNoNumericoEs422(): void
    {
        $respuesta = $this->post_('api/v1/unidades', [
            'id_unidad' => 'WH132', 'tipo' => 'Tractor', 'fecha_alta' => '2026-07-01',
            'valor_referencia' => 'seiscientos mil',
        ], $this->comoAdmin());
        $respuesta->assertStatus(422);
        $this->assertArrayHasKey('valor_referencia', $this->json($respuesta)['fields']);
    }

    public function testCambioAYonkeLaVuelveDonanteYAudita(): void
    {
        $alta = $this->json($this->post_('api/v1/unidades', [
            'id_unidad' => 'WH140', 'tipo' => 'Tractor', 'fecha_alta' => '2026-07-01',
        ], $this->comoAdmin()));

        $this->patch_('api/v1/unidades/' . $alta['id'], ['estado' => 'Yonke'], $this->comoAdmin())
            ->assertStatus(200);

        $donantes = $this->json(
            $this->withHeaders(['Authorization' => 'Bearer ' . $this->comoAdmin()])
                ->get('api/v1/unidades?estado=Yonke'),
        );
        $this->assertContains('WH140', array_column($donantes['data'], 'id_unidad'));

        $this->seeInDatabase('auditoria', ['entidad' => 'unidades', 'entidad_id' => $alta['id'], 'accion' => 'unidad.estado']);
    }

    public function testCambioDeValorReferenciaSeAudita(): void
    {
        $alta = $this->json($this->post_('api/v1/unidades', [
            'id_unidad' => 'WH141', 'tipo' => 'Tractor', 'fecha_alta' => '2026-07-01', 'valor_referencia' => 100000,
        ], $this->comoAdmin()));

        $this->patch_('api/v1/unidades/' . $alta['id'], ['valor_referencia' => 550000], $this->comoAdmin())
            ->assertStatus(200);

        $this->seeInDatabase('auditoria', [
            'entidad' => 'unidades', 'entidad_id' => $alta['id'], 'accion' => 'unidad.valor_referencia',
        ]);
    }

    public function testPatchPorRolNoAdminEs403(): void
    {
        $this->patch_('api/v1/unidades/1', ['estado' => 'Yonke'], $this->comoTaller())->assertStatus(403);
    }

    // ---- doc 06 §2.8: máquina de estados exhaustiva ----

    public function testMaquinaDeEstadosExhaustiva(): void
    {
        $casos = [
            // [desde, hacia, status esperado]
            ['Activo', 'Yonke', 200],
            ['Activo', 'Inactivo', 200],
            ['Yonke', 'Activo', 200],
            ['Yonke', 'Inactivo', 200],
            ['Inactivo', 'Activo', 409],
            ['Inactivo', 'Yonke', 409],
        ];

        foreach ($casos as $i => [$desde, $hacia, $esperado]) {
            $alta = $this->json($this->post_('api/v1/unidades', [
                'id_unidad' => 'MQ' . $i, 'tipo' => 'Tractor', 'estado' => $desde, 'fecha_alta' => '2026-07-01',
            ], $this->comoAdmin()));

            $this->patch_('api/v1/unidades/' . $alta['id'], ['estado' => $hacia], $this->comoAdmin())
                ->assertStatus($esperado, "Transición {$desde}→{$hacia} debía dar {$esperado}");
        }
    }

    public function testPatchUnidadInexistenteEs404(): void
    {
        $this->patch_('api/v1/unidades/99999', ['estado' => 'Yonke'], $this->comoAdmin())->assertStatus(404);
    }

    // ---- Ficha base (RF-FIC-01..04) ----

    public function testFichaDeUnidadActiva(): void
    {
        $wh125 = $this->idDe('WH125');
        $json  = $this->json(
            $this->withHeaders(['Authorization' => 'Bearer ' . $this->comoTaller()])
                ->get("api/v1/unidades/{$wh125}/ficha"),
        );

        $this->assertSame('WH125', $json['unidad']['id_unidad']);
        $this->assertSame(93500.0, (float) $json['kpis']['costo_real_acumulado']);
        $dias = array_column($json['reparaciones'], 'dias_en_taller');
        $this->assertContains(86, $dias);
        $piezas = array_column($json['piezas_instaladas'], 'descripcion_pieza');
        $this->assertContains('Caja de transmisión', $piezas);
        $yonke = array_values(array_filter($json['piezas_instaladas'], static fn (array $p): bool => $p['origen'] === 'Yonke'))[0];
        $this->assertTrue((bool) $yonke['es_estimado']);
        $this->assertSame('WH60', $yonke['unidad_donante_id']);
    }

    public function testFichaDeYonkeMuestraDonaciones(): void
    {
        $wh03 = $this->idDe('WH03');
        $json = $this->json(
            $this->withHeaders(['Authorization' => 'Bearer ' . $this->comoAdmin()])
                ->get("api/v1/unidades/{$wh03}/ficha"),
        );

        $this->assertSame([], $json['reparaciones']);
        $this->assertSame([], $json['piezas_instaladas']);
        $destinos = array_column($json['piezas_donadas'], 'unidad_destino');
        $this->assertContains('WH101', $destinos);
    }

    public function testFichaInexistenteEs404(): void
    {
        $this->withHeaders(['Authorization' => 'Bearer ' . $this->comoAdmin()])
            ->get('api/v1/unidades/99999/ficha')
            ->assertStatus(404);
    }

    private function idDe(string $idUnidad): int
    {
        $fila = $this->db->table('unidades')->where('id_unidad', $idUnidad)->get()->getRowArray();
        $this->assertIsArray($fila);

        return (int) $fila['id'];
    }
}
