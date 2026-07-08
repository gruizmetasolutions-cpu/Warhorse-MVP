<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Database\Seeds\InitialSeeder;
use CodeIgniter\Test\CIUnitTestCase;
use CodeIgniter\Test\DatabaseTestTrait;
use CodeIgniter\Test\FeatureTestTrait;

/**
 * Sprint 6 — RF-INT-05: bitácora de auditoría consultable (doc 05 §9).
 */
final class AuditoriaTest extends CIUnitTestCase
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
    private function bitacora(string $query = ''): array
    {
        $r = $this->withHeaders(['Authorization' => 'Bearer ' . $this->comoAdmin()])
            ->get('api/v1/auditoria' . $query);
        $r->assertStatus(200);

        return (array) json_decode((string) $r->response()->getBody(), true);
    }

    /**
     * Genera un evento auditado real (alta de unidad por admin).
     */
    private function generarEvento(string $idUnidad): void
    {
        $this->withHeaders(['Authorization' => 'Bearer ' . $this->comoAdmin()])
            ->withBodyFormat('json')
            ->post('api/v1/unidades', [
                'id_unidad'  => $idUnidad,
                'tipo'       => 'Tractor',
                'estado'     => 'Activo',
                'fecha_alta' => '2026-07-08',
            ])->assertStatus(201);
    }

    public function testListadoConActorYPaginacion(): void
    {
        $this->generarEvento('AUD1');

        $json = $this->bitacora('?per_page=5');

        $this->assertArrayHasKey('meta', $json);
        $this->assertNotSame([], $json['data']);
        $this->assertLessThanOrEqual(5, count($json['data']));

        $fila = $json['data'][0];
        foreach (['id', 'actor_id', 'actor', 'accion', 'entidad', 'entidad_id', 'valor_anterior', 'valor_nuevo', 'creado_en'] as $campo) {
            $this->assertArrayHasKey($campo, $fila);
        }
        // El actor llega con nombre legible, no solo id (RF-INT-05)
        $this->assertIsString($fila['actor']);
        // JSON decodificado, no string crudo
        $this->assertTrue($fila['valor_nuevo'] === null || is_array($fila['valor_nuevo']));
    }

    public function testFiltrosPorEntidadAccionYActor(): void
    {
        $this->generarEvento('AUD2');

        $porEntidad = $this->bitacora('?entidad=unidades&accion=unidad.alta');
        $this->assertNotSame([], $porEntidad['data']);
        foreach ($porEntidad['data'] as $fila) {
            $this->assertSame('unidades', $fila['entidad']);
            $this->assertSame('unidad.alta', $fila['accion']);
        }

        // entidad_id concreto: solo la unidad recién creada
        $unidadId = (int) $porEntidad['data'][0]['entidad_id'];
        $porId    = $this->bitacora("?entidad=unidades&entidad_id={$unidadId}");
        foreach ($porId['data'] as $fila) {
            $this->assertSame($unidadId, (int) $fila['entidad_id']);
        }

        // actor_id del admin
        $actorId  = (int) $porEntidad['data'][0]['actor_id'];
        $porActor = $this->bitacora("?actor_id={$actorId}");
        foreach ($porActor['data'] as $fila) {
            $this->assertSame($actorId, (int) $fila['actor_id']);
        }
    }

    public function testFiltroPorRangoDeFechas(): void
    {
        $this->generarEvento('AUD3');

        $hoy = $this->bitacora('?desde=2026-07-08&hasta=2026-07-08');
        $this->assertNotSame([], $hoy['data']);

        $futuro = $this->bitacora('?desde=2030-01-01');
        $this->assertSame([], $futuro['data']);
    }

    public function testBitacoraSoloAdmin(): void
    {
        $this->withHeaders(['Authorization' => 'Bearer ' . $this->comoTaller()])
            ->get('api/v1/auditoria')->assertStatus(403);
    }
}
