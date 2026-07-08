<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Database\Seeds\InitialSeeder;
use CodeIgniter\Test\CIUnitTestCase;
use CodeIgniter\Test\DatabaseTestTrait;
use CodeIgniter\Test\FeatureTestTrait;

/**
 * Sprint 6 — SRS §9: métricas de salud de datos (adopción).
 */
final class MetricasTest extends CIUnitTestCase
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
    private function salud(): array
    {
        $r = $this->withHeaders(['Authorization' => 'Bearer ' . $this->comoAdmin()])
            ->get('api/v1/metricas/salud');
        $r->assertStatus(200);

        return (array) json_decode((string) $r->response()->getBody(), true);
    }

    public function testMetricasDelSeedDemo(): void
    {
        $json = $this->salud();

        // 8 requisiciones del demo, todas con foto y origen (el sistema lo exige)
        $this->assertSame(8, (int) $json['requisiciones']['total']);
        $this->assertSame(8, (int) $json['requisiciones']['con_foto_y_origen']);
        $this->assertSame(100, (int) $json['requisiciones']['pct']);

        // 10 reparaciones liberadas, todas con tipo
        $this->assertSame(10, (int) $json['liberaciones']['total']);
        $this->assertSame(10, (int) $json['liberaciones']['con_tipo']);
        $this->assertSame(100, (int) $json['liberaciones']['pct']);

        // 4 piezas Yonke, todas valorizadas por catálogo (ADR-002 nivel C)
        $this->assertSame(4, (int) $json['yonke']['total']);
        $this->assertSame(4, (int) $json['yonke']['con_costo']);
        $this->assertSame(100, (int) $json['yonke']['pct']);
        $this->assertSame(4, (int) $json['yonke']['por_origen']['catalogo']);
        $this->assertSame(0, (int) $json['yonke']['por_origen']['ultima_compra']);
        $this->assertSame(0, (int) $json['yonke']['por_origen']['manual']);
    }

    public function testUnIngresoAbiertoNoCuentaComoLiberacion(): void
    {
        // Un ingreso sin liberar no es una liberación pendiente de tipo:
        // la base de la métrica son los registros cerrados (SRS §9)
        $this->withHeaders(['Authorization' => 'Bearer ' . $this->comoTaller()])
            ->withBodyFormat('json')
            ->post('api/v1/taller', [
                'unidad_id'     => 1,
                'fecha_ingreso' => '2026-07-08',
                'diagnostico'   => 'Métrica abierta',
                'criticidad'    => 'Media',
            ])->assertStatus(201);

        $json = $this->salud();
        $this->assertSame(10, (int) $json['liberaciones']['total']);
        $this->assertSame(100, (int) $json['liberaciones']['pct']);
    }

    public function testMetricasSoloAdmin(): void
    {
        $this->withHeaders(['Authorization' => 'Bearer ' . $this->comoTaller()])
            ->get('api/v1/metricas/salud')->assertStatus(403);
    }
}
