<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Database\Seeds\InitialSeeder;
use CodeIgniter\Test\CIUnitTestCase;
use CodeIgniter\Test\DatabaseTestTrait;
use CodeIgniter\Test\FeatureTestTrait;

/**
 * Sprint 5 — RF-DASH-05: parámetros del veredicto ajustables en runtime.
 */
final class ParametrosTest extends CIUnitTestCase
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
    private static ?string $tokenDiesel = null;

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

    private function comoDiesel(): string
    {
        return self::$tokenDiesel ??= $this->token('greisy@warhorse.mx');
    }

    /**
     * @return array<string, mixed>
     */
    private function json(\CodeIgniter\Test\TestResponse $r): array
    {
        return (array) json_decode((string) $r->response()->getBody(), true);
    }

    /**
     * @param array<string, mixed> $datos
     */
    private function ajustar(array $datos, ?string $token = null): \CodeIgniter\Test\TestResponse
    {
        return $this->withHeaders(['Authorization' => 'Bearer ' . ($token ?? $this->comoAdmin())])
            ->withBodyFormat('json')
            ->patch('api/v1/parametros/veredicto', $datos);
    }

    public function testLecturaDevuelveUmbralYVentanaSembrados(): void
    {
        $r = $this->withHeaders(['Authorization' => 'Bearer ' . $this->comoAdmin()])
            ->get('api/v1/parametros/veredicto');

        $r->assertStatus(200);
        $json = $this->json($r);
        $this->assertSame(40, (int) $json['umbral_pct']);
        $this->assertSame(12, (int) $json['ventana_meses']);
    }

    public function testAjusteValidoActualizaYAudita(): void
    {
        $r = $this->ajustar(['umbral_pct' => 50, 'ventana_meses' => 6]);

        $r->assertStatus(200);
        $json = $this->json($r);
        $this->assertSame(50, (int) $json['umbral_pct']);
        $this->assertSame(6, (int) $json['ventana_meses']);

        $this->seeInDatabase('parametros_veredicto', ['umbral_pct' => 50, 'ventana_meses' => 6]);
        // RF-INT-05 / doc 05 §8: cambio auditado
        $this->seeInDatabase('auditoria', ['entidad' => 'parametros_veredicto', 'accion' => 'parametros.veredicto']);

        // Restaurar para el resto de la suite (seedOnce)
        $this->ajustar(['umbral_pct' => 40, 'ventana_meses' => 12])->assertStatus(200);
    }

    public function testFueraDeRangoEs422(): void
    {
        // umbral 20–80, ventana 1–36 (doc 05 §8)
        $this->ajustar(['umbral_pct' => 19, 'ventana_meses' => 12])->assertStatus(422);
        $this->ajustar(['umbral_pct' => 81, 'ventana_meses' => 12])->assertStatus(422);
        $this->ajustar(['umbral_pct' => 40, 'ventana_meses' => 0])->assertStatus(422);
        $this->ajustar(['umbral_pct' => 40, 'ventana_meses' => 37])->assertStatus(422);
        $this->ajustar(['umbral_pct' => 'cuarenta', 'ventana_meses' => 12])->assertStatus(422);

        // Nada cambió
        $this->seeInDatabase('parametros_veredicto', ['umbral_pct' => 40, 'ventana_meses' => 12]);
    }

    public function testAjustePorRolNoAdminEs403(): void
    {
        $this->ajustar(['umbral_pct' => 50, 'ventana_meses' => 12], $this->comoDiesel())->assertStatus(403);

        $this->withHeaders(['Authorization' => 'Bearer ' . $this->comoDiesel()])
            ->get('api/v1/parametros/veredicto')->assertStatus(403);
    }
}
