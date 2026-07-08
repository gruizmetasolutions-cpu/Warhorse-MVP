<?php

declare(strict_types=1);

namespace Tests\Rendimiento;

use App\Database\Seeds\CargaSeeder;
use App\Database\Seeds\InitialSeeder;
use CodeIgniter\Test\CIUnitTestCase;
use CodeIgniter\Test\DatabaseTestTrait;
use CodeIgniter\Test\FeatureTestTrait;

/**
 * Sprint 5 — doc 06 §3: rendimiento con el escenario de carga (~200 unidades,
 * ~5.000 requisiciones). Corre contra la BD de pruebas local; los tiempos son
 * in-process (framework + SQL, sin red), la aproximación local del p95.
 */
final class RendimientoTest extends CIUnitTestCase
{
    use DatabaseTestTrait;
    use FeatureTestTrait;

    protected $migrate     = true;
    protected $migrateOnce = true;
    protected $refresh     = true;
    protected $namespace   = null;
    protected $seed        = InitialSeeder::class;
    protected $seedOnce    = true;

    private function token(string $email): string
    {
        $r = $this->withBodyFormat('json')->post('api/v1/auth/login', ['email' => $email, 'password' => 'warhorse-demo']);
        $r->assertStatus(200);

        return (string) json_decode((string) $r->response()->getBody(), true)['token'];
    }

    private function explainCola(string $where, string $indiceEsperado): void
    {
        $explain = $this->db->query(
            "EXPLAIN SELECT r.*, d.id_unidad AS unidad_destino, y.id_unidad AS unidad_donante
             FROM requisiciones r
             JOIN unidades d ON d.id = r.unidad_destino_id
             LEFT JOIN unidades y ON y.id = r.unidad_donante_id
             {$where}
             ORDER BY r.urgencia DESC, r.fecha_solicitud ASC
             LIMIT 100",
        )->getResultArray();

        $filaCola = null;
        foreach ($explain as $fila) {
            if (($fila['table'] ?? '') === 'r') {
                $filaCola = $fila;
            }
        }
        $this->assertIsArray($filaCola, 'EXPLAIN sin fila para requisiciones');
        $extra = (string) ($filaCola['Extra'] ?? '');
        $this->assertStringNotContainsString('filesort', $extra, "La cola de Compras no debe ordenar con filesort (doc 06 §3). Extra: {$extra}");
        $this->assertStringContainsString($indiceEsperado, (string) ($filaCola['key'] ?? ''), 'La cola debe resolverse con el índice de cola');
    }

    /**
     * @param list<float> $muestras
     */
    private function p95(array $muestras): float
    {
        sort($muestras);

        return $muestras[(int) ceil(count($muestras) * 0.95) - 1];
    }

    /**
     * @return list<float> latencias en ms
     */
    private function medir(string $ruta, string $token, int $n): array
    {
        $tiempos = [];
        for ($i = 0; $i < $n; $i++) {
            $inicio = hrtime(true);
            $this->withHeaders(['Authorization' => 'Bearer ' . $token])->get($ruta)->assertStatus(200);
            $tiempos[] = (hrtime(true) - $inicio) / 1e6;
        }

        return $tiempos;
    }

    public function testCargaExplainYP95(): void
    {
        // ---- escenario doc 06 §3 sembrado encima del seed base ----
        \Config\Database::seeder()->call(CargaSeeder::class);

        $unidades      = (int) ($this->db->table('unidades')->countAllResults());
        $requisiciones = (int) ($this->db->table('requisiciones')->countAllResults());
        $this->assertGreaterThanOrEqual(200, $unidades);
        $this->assertGreaterThanOrEqual(5000, $requisiciones);

        // ---- EXPLAIN de la cola de Compras (con y sin filtro): índice, cero filesort ----
        $this->explainCola("WHERE r.estado = 'Solicitado'", 'idx_req_cola');
        $this->explainCola('', 'idx_req_cola_global');

        // ---- EXPLAIN del dashboard: agregado y ranking usan el consolidado ----
        $explainDash = $this->db->query(
            "EXPLAIN SELECT u.id, u.id_unidad, u.valor_referencia, c.costo_real_acumulado costo_total
             FROM consolidado_unidad c
             JOIN unidades u ON u.id = c.unidad_id
             WHERE u.estado = 'Activo' AND u.tipo = 'Tractor'
             ORDER BY c.costo_real_acumulado DESC, u.id_unidad ASC",
        )->getResultArray();
        $this->assertNotEmpty($explainDash);
        foreach ($explainDash as $fila) {
            // Sin full scan sobre requisiciones/diésel/taller: el dashboard es O(unidades)
            $this->assertContains($fila['table'], ['u', 'c'], 'El dashboard solo debe tocar unidades y consolidado');
        }

        // ---- p95 in-process (doc 06 §3) ----
        $tokenAdmin   = $this->token('direccion@warhorse.mx');
        $tokenCompras = $this->token('montzay@warhorse.mx');

        // Calentamiento (autoloader/caches del framework)
        $this->medir('api/v1/dashboard', $tokenAdmin, 3);

        $dashboard = $this->medir('api/v1/dashboard', $tokenAdmin, 40);
        $cola      = $this->medir('api/v1/compras/requisiciones?estado=Solicitado', $tokenCompras, 40);
        $colaFull  = $this->medir('api/v1/compras/requisiciones', $tokenCompras, 40);

        $p95Dashboard = $this->p95($dashboard);
        $p95Cola      = $this->p95($cola);
        $p95ColaFull  = $this->p95($colaFull);

        fwrite(STDERR, sprintf(
            "\n[doc 06 §3] unidades=%d requisiciones=%d · p95 dashboard=%.1fms · p95 cola(Solicitado)=%.1fms · p95 cola completa=%.1fms\n",
            $unidades,
            $requisiciones,
            $p95Dashboard,
            $p95Cola,
            $p95ColaFull,
        ));

        $this->assertLessThan(400, $p95Dashboard, 'GET /dashboard p95 >= 400ms');
        $this->assertLessThan(400, $p95Cola, 'GET /compras/requisiciones p95 >= 400ms');
        $this->assertLessThan(400, $p95ColaFull, 'GET /compras/requisiciones (sin filtro) p95 >= 400ms');
    }
}
