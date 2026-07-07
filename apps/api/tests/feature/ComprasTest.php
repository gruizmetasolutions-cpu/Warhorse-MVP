<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Database\Seeds\InitialSeeder;
use CodeIgniter\Test\CIUnitTestCase;
use CodeIgniter\Test\DatabaseTestTrait;
use CodeIgniter\Test\FeatureTestTrait;

/**
 * Sprint 4 — doc 06 §2.7 (máquina de estados de Requisición, exhaustiva)
 * y transacción ACID de instalación (doc 02 §4.3).
 */
final class ComprasTest extends CIUnitTestCase
{
    use DatabaseTestTrait;
    use FeatureTestTrait;

    protected $migrate     = true;
    protected $migrateOnce = true;
    protected $refresh     = true;
    protected $namespace   = null;
    protected $seed        = InitialSeeder::class;
    protected $seedOnce    = true;

    private static ?string $tokenCompras = null;
    private static ?string $tokenTaller  = null;

    private function token(string $email): string
    {
        $r = $this->withBodyFormat('json')->post('api/v1/auth/login', ['email' => $email, 'password' => 'warhorse-demo']);
        $r->assertStatus(200);

        return (string) json_decode((string) $r->response()->getBody(), true)['token'];
    }

    private function comoCompras(): string
    {
        return self::$tokenCompras ??= $this->token('montzay@warhorse.mx');
    }

    private function comoTaller(): string
    {
        return self::$tokenTaller ??= $this->token('edgar@warhorse.mx');
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
     * Inserta una requisición base en el estado deseado (para la matriz §2.7).
     *
     * @param array<string, mixed> $extra
     */
    private function requisicionEn(string $estado, string $origen, array $extra = []): int
    {
        $usuario = $this->db->table('usuarios')->where('rol', 'taller')->get()->getRowArray();
        $this->assertIsArray($usuario);

        $fila = [
            'unidad_destino_id' => $this->idUnidad('WH210'),
            'origen'            => $origen,
            'unidad_donante_id' => $origen === 'Yonke' ? $this->idUnidad('WH03') : null,
            'descripcion_pieza' => 'Pieza de matriz',
            'foto_pieza_url'    => 'matriz.jpg',
            'urgencia'          => 'Media',
            'costo_estimado'    => $origen === 'Yonke' ? 1000.00 : null,
            'origen_costo_estimado' => $origen === 'Yonke' ? 'manual' : null,
            'estado'            => $estado,
            'fecha_solicitud'   => '2026-07-01',
            'creado_por'        => (int) $usuario['id'],
        ] + $extra;

        $this->db->table('requisiciones')->insert($fila);

        return (int) $this->db->insertID();
    }

    /**
     * @param array<string, mixed> $cambio
     */
    private function avanzar(int $id, array $cambio, ?string $token = null): \CodeIgniter\Test\TestResponse
    {
        return $this->withHeaders(['Authorization' => 'Bearer ' . ($token ?? $this->comoCompras())])
            ->withBodyFormat('json')
            ->patch("api/v1/compras/requisiciones/{$id}/estado", $cambio);
    }

    // ---- Cola (RF-COM-01) ----

    public function testColaOrdenadaPorUrgenciaYFiltrable(): void
    {
        $r = $this->withHeaders(['Authorization' => 'Bearer ' . $this->comoCompras()])
            ->get('api/v1/compras/requisiciones');
        $r->assertStatus(200);
        $data = $this->json($r)['data'];

        $urgencias = array_column($data, 'urgencia');
        $peso      = ['Crítica' => 0, 'Media' => 1, 'Rápida' => 2];
        $pesos     = array_map(static fn (string $u): int => $peso[$u], $urgencias);
        $ordenado  = $pesos;
        sort($ordenado);
        $this->assertSame($ordenado, $pesos, 'La cola debe venir ordenada Crítica→Media→Rápida');

        $solicitadas = $this->json(
            $this->withHeaders(['Authorization' => 'Bearer ' . $this->comoCompras()])
                ->get('api/v1/compras/requisiciones?estado=Solicitado'),
        )['data'];
        $this->assertNotSame([], $solicitadas);
        foreach ($solicitadas as $q) {
            $this->assertSame('Solicitado', $q['estado']);
        }
    }

    public function testColaProhibidaParaTaller(): void
    {
        $this->withHeaders(['Authorization' => 'Bearer ' . $this->comoTaller()])
            ->get('api/v1/compras/requisiciones')
            ->assertStatus(403);
    }

    // ---- doc 06 §2.7: matriz exhaustiva ----

    public function testMatrizDeTransicionesExhaustiva(): void
    {
        $conCosto = ['costo_real' => 5200.00, 'numero_factura' => 'F-1'];

        $casos = [
            // [origen, estado inicial, cambio, status esperado]
            ['Compra', 'Solicitado', ['estado' => 'Cotizado'], 200],
            ['Compra', 'Solicitado', ['estado' => 'Comprado'] + $conCosto, 409],
            ['Compra', 'Solicitado', ['estado' => 'Instalado'], 409],
            ['Yonke', 'Solicitado', ['estado' => 'Instalado'], 200],
            ['Yonke', 'Solicitado', ['estado' => 'Cotizado'], 409],
            ['Compra', 'Cotizado', ['estado' => 'Cotizado'], 409],
            ['Compra', 'Cotizado', ['estado' => 'Comprado'] + $conCosto, 200],
            ['Compra', 'Cotizado', ['estado' => 'Instalado'], 409],
            ['Compra', 'Comprado', ['estado' => 'Instalado'], 200],
            ['Compra', 'Comprado', ['estado' => 'Cotizado'], 409],
            ['Instalado bloquea Compra', 'Instalado', ['estado' => 'Cotizado'], 409],
            ['Instalado bloquea Compra 2', 'Instalado', ['estado' => 'Comprado'] + $conCosto, 409],
        ];

        foreach ($casos as [$etiqueta, $estado, $cambio, $esperado]) {
            $origen = str_starts_with($etiqueta, 'Yonke') ? 'Yonke' : 'Compra';
            $extra  = $estado === 'Comprado' || ($origen === 'Compra' && $estado === 'Instalado')
                ? ['costo_real' => 5200.00, 'numero_factura' => 'F-0']
                : [];
            $id = $this->requisicionEn($estado, $origen, $extra);

            $this->avanzar($id, $cambio)->assertStatus($esperado, "{$etiqueta}: {$estado} → {$cambio['estado']} debía dar {$esperado}");
        }
    }

    public function testCompradoSinCostoRealEs422(): void
    {
        $id = $this->requisicionEn('Cotizado', 'Compra');
        $r  = $this->avanzar($id, ['estado' => 'Comprado']);
        $r->assertStatus(422);
        $this->assertArrayHasKey('costo_real', $this->json($r)['fields']);
    }

    public function testYonkeConFacturaEs409(): void
    {
        $id = $this->requisicionEn('Solicitado', 'Yonke');
        $this->avanzar($id, ['estado' => 'Instalado', 'numero_factura' => 'F-ILEGAL'])->assertStatus(409);
    }

    public function testAvanzarPorRolTallerEs403(): void
    {
        $id = $this->requisicionEn('Solicitado', 'Compra');
        $this->avanzar($id, ['estado' => 'Cotizado'], $this->comoTaller())->assertStatus(403);
    }

    public function testRequisicionInexistenteEs404(): void
    {
        $this->avanzar(99999, ['estado' => 'Cotizado'])->assertStatus(404);
    }

    // ---- Transacción ACID de instalación (doc 02 §4.3) ----

    public function testInstalarCompraSumaCostoRealAlConsolidadoYAudita(): void
    {
        $unidadId = $this->idUnidad('WH210');
        $antes    = (float) $this->consolidadoRefacciones($unidadId);

        $id = $this->requisicionEn('Comprado', 'Compra', ['costo_real' => 5200.00, 'numero_factura' => 'F-9']);
        $this->avanzar($id, ['estado' => 'Instalado'])->assertStatus(200);

        $this->assertSame($antes + 5200.00, (float) $this->consolidadoRefacciones($unidadId));
        $this->seeInDatabase('auditoria', ['entidad' => 'requisiciones', 'entidad_id' => $id, 'accion' => 'requisicion.instalada']);

        $fila = $this->db->table('requisiciones')->where('id', $id)->get()->getRowArray();
        $this->assertIsArray($fila);
        $this->assertNotNull($fila['fecha_instalacion']);
    }

    public function testInstalarYonkeSumaEstimadoAlConsolidado(): void
    {
        $unidadId = $this->idUnidad('WH210');
        $antes    = (float) $this->consolidadoRefacciones($unidadId);

        $id = $this->requisicionEn('Solicitado', 'Yonke'); // costo_estimado 1000
        $this->avanzar($id, ['estado' => 'Instalado'])->assertStatus(200);

        $this->assertSame($antes + 1000.00, (float) $this->consolidadoRefacciones($unidadId));
    }

    public function testTransicionIlegalNoTocaElConsolidado(): void
    {
        $unidadId = $this->idUnidad('WH210');
        $antes    = (float) $this->consolidadoRefacciones($unidadId);

        $id = $this->requisicionEn('Solicitado', 'Compra');
        $this->avanzar($id, ['estado' => 'Instalado'])->assertStatus(409);

        $this->assertSame($antes, (float) $this->consolidadoRefacciones($unidadId));
        $fila = $this->db->table('requisiciones')->where('id', $id)->get()->getRowArray();
        $this->assertIsArray($fila);
        $this->assertSame('Solicitado', $fila['estado']);
    }

    private function consolidadoRefacciones(int $unidadId): float
    {
        $fila = $this->db->table('consolidado_unidad')->where('unidad_id', $unidadId)->get()->getRowArray();

        return (float) ($fila['total_refacciones'] ?? 0);
    }
}
