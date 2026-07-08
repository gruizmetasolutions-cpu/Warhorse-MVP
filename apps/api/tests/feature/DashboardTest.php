<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Database\Seeds\InitialSeeder;
use CodeIgniter\Test\CIUnitTestCase;
use CodeIgniter\Test\DatabaseTestTrait;
use CodeIgniter\Test\FeatureTestTrait;

/**
 * Sprint 5 — doc 06 §2.6 (Dashboard) con veredicto server-side (RF-DASH-01..06).
 */
final class DashboardTest extends CIUnitTestCase
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
        $r = $this->withBodyFormat('json')->post('api/v1/auth/login', ['email' => $email, 'password' => 'warhorse-demo']);
        $r->assertStatus(200);

        return (string) json_decode((string) $r->response()->getBody(), true)['token'];
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
     * @return array<string, mixed>
     */
    private function dashboard(string $query = ''): array
    {
        $r = $this->withHeaders(['Authorization' => 'Bearer ' . $this->comoAdmin()])
            ->get('api/v1/dashboard' . $query);
        $r->assertStatus(200);

        return (array) json_decode((string) $r->response()->getBody(), true);
    }

    /**
     * @param array<string, mixed> $datos
     */
    private function ajustarParametros(array $datos): void
    {
        $this->withHeaders(['Authorization' => 'Bearer ' . $this->comoAdmin()])
            ->withBodyFormat('json')
            ->patch('api/v1/parametros/veredicto', $datos)
            ->assertStatus(200);
    }

    // ---- RF-DASH-01: KPIs O(1) del consolidado + ranking con crítico ----

    public function testKpisYRankingConCritico(): void
    {
        $json = $this->dashboard();

        // KPIs = suma del consolidado de tractores Activos del seeder demo
        $this->assertSame(124900.0, (float) $json['kpis']['diesel']);
        $this->assertSame(85000.0, (float) $json['kpis']['refacciones']);
        $this->assertSame(60700.0, (float) $json['kpis']['taller']);
        $this->assertSame(270600.0, (float) $json['kpis']['costo_real_acumulado']);

        // Ranking desc por costo; la barra del mayor costo va marcada critico
        $ranking = $json['ranking'];
        $this->assertSame('WH125', $ranking[0]['id_unidad']);
        $this->assertTrue($ranking[0]['critico']);
        $this->assertSame(93500.0, (float) $ranking[0]['costo_total']);

        $costos = array_map(static fn (array $f): float => (float) $f['costo_total'], $ranking);
        $ordenados = $costos;
        rsort($ordenados);
        $this->assertSame($ordenados, $costos);
        $this->assertCount(1, array_filter($ranking, static fn (array $f): bool => (bool) $f['critico']));

        // Parámetros vigentes expuestos (doc 05 §8)
        $this->assertSame(40, (int) $json['parametros']['umbral_pct']);
        $this->assertSame(12, (int) $json['parametros']['ventana_meses']);
    }

    // ---- RF-DASH-04: veredicto server-side ----

    public function testVeredictoSobreUmbralConMejoralitoEsVender(): void
    {
        // Selección default = la unidad crítica (WH125: 45% de 210,000, 67% mejoralito)
        $sel = $this->dashboard()['seleccion'];

        $this->assertSame('WH125', $sel['id_unidad']);
        $this->assertSame('Vender', $sel['veredicto']);
        $this->assertFalse($sel['valor_referencia_pendiente']);
        $this->assertStringContainsString('por encima del umbral del 40%', $sel['razon']);
        $this->assertStringContainsString('reincide', $sel['razon']);

        // RF-DASH-02/03: eficiencia real km/L y % mantenimiento desde registros
        $this->assertSame(1.2, (float) $sel['eficiencia_km_l']);
        $this->assertSame(33, (int) $sel['pct_reparacion_total']);
        $this->assertSame(67, (int) $sel['pct_mejoralito']);
    }

    public function testVeredictoBajoUmbralEsMantener(): void
    {
        $sel = $this->dashboard('?seleccion=WH101')['seleccion'];

        $this->assertSame('WH101', $sel['id_unidad']);
        $this->assertSame('Mantener', $sel['veredicto']);
        $this->assertStringContainsString('debajo del umbral del 40%', $sel['razon']);
        $this->assertSame(100, (int) $sel['pct_reparacion_total']);
        $this->assertSame(2.4, (float) $sel['eficiencia_km_l']);
    }

    public function testSobreUmbralSinMejoralitosEsEvaluar(): void
    {
        $id = $this->crearUnidad('TST9', 10000.00);
        $this->db->table('consolidado_unidad')->where('unidad_id', $id)->update(['total_refacciones' => 5000.00]);

        $sel = $this->dashboard('?seleccion=TST9')['seleccion'];
        $this->assertSame('Evaluar', $sel['veredicto']);
        $this->assertStringContainsString('por encima del umbral del 40%', $sel['razon']);
        // Sin cargas de diésel el KPI de eficiencia se inhabilita (RF-DASH-02)
        $this->assertNull($sel['eficiencia_km_l']);

        $this->eliminarUnidad($id);
    }

    public function testUnidadSinValorReferenciaVeredictoNull(): void
    {
        $id = $this->crearUnidad('TST8', null);

        $sel = $this->dashboard('?seleccion=TST8')['seleccion'];
        $this->assertNull($sel['veredicto']);
        $this->assertTrue($sel['valor_referencia_pendiente']);

        $this->eliminarUnidad($id);
    }

    // ---- RF-DASH-05: el ajuste de umbral recalcula sin tocar código ----

    public function testAjusteDeUmbralRecalculaVeredicto(): void
    {
        $this->ajustarParametros(['umbral_pct' => 50, 'ventana_meses' => 12]);
        $sel = $this->dashboard()['seleccion'];
        $this->assertSame('Mantener', $sel['veredicto']);

        // La ventana también recalcula: a 1 mes solo quedan mejoralitos de WH125
        $this->ajustarParametros(['umbral_pct' => 40, 'ventana_meses' => 1]);
        $sel = $this->dashboard()['seleccion'];
        $this->assertSame('Vender', $sel['veredicto']);
        $this->assertSame(100, (int) $sel['pct_mejoralito']);

        $this->ajustarParametros(['umbral_pct' => 40, 'ventana_meses' => 12]);
        $this->assertSame('Vender', $this->dashboard()['seleccion']['veredicto']);
    }

    // ---- RF-DASH-06: solo Dirección ----

    public function testAccesoPorRolNoAdminEs403(): void
    {
        $this->withHeaders(['Authorization' => 'Bearer ' . $this->comoTaller()])
            ->get('api/v1/dashboard')->assertStatus(403);
    }

    private function crearUnidad(string $idUnidad, ?float $valor): int
    {
        $datos = [
            'id_unidad'  => $idUnidad,
            'tipo'       => 'Tractor',
            'estado'     => 'Activo',
            'fecha_alta' => '2026-07-01',
        ];
        if ($valor !== null) {
            $datos['valor_referencia'] = $valor;
        }
        $r = $this->withHeaders(['Authorization' => 'Bearer ' . $this->comoAdmin()])
            ->withBodyFormat('json')
            ->post('api/v1/unidades', $datos);
        $r->assertStatus(201);

        return (int) json_decode((string) $r->response()->getBody(), true)['id'];
    }

    private function eliminarUnidad(int $id): void
    {
        // Limpieza (seedOnce): el consolidado cae en cascada; auditoría queda
        $this->db->table('auditoria')->where('entidad', 'unidades')->where('entidad_id', $id)->delete();
        $this->db->table('unidades')->where('id', $id)->delete();
    }
}
