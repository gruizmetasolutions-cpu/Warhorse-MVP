<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Database\Seeds\InitialSeeder;
use CodeIgniter\Test\CIUnitTestCase;
use CodeIgniter\Test\DatabaseTestTrait;
use CodeIgniter\Test\FeatureTestTrait;

/**
 * Sprint 6 — doc 06 §2.10: casos negativos OWASP que faltaban (A03 inyección,
 * XSS almacenado, A05 cabeceras y rate limit en mutantes). El resto de la
 * batería vive en AuthTest (A07), RequisicionesTest (A01 IDOR/A08),
 * UsuariosTest (escalada) y ComprasTest/AuditoriaTest (A09).
 */
final class SeguridadTest extends CIUnitTestCase
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
    private function json(\CodeIgniter\Test\TestResponse $r): array
    {
        return (array) json_decode((string) $r->response()->getBody(), true);
    }

    // ---- A03: inyección SQL en filtros parametrizados ----

    public function testSqliEnFiltrosNoTieneEfecto(): void
    {
        // Filtro con lista blanca → 422, jamás llega al SQL
        $this->withHeaders(['Authorization' => 'Bearer ' . $this->comoAdmin()])
            ->get('api/v1/compras/requisiciones?estado=' . urlencode("Comprado' OR '1'='1"))
            ->assertStatus(422);

        // Filtro de texto libre parametrizado → 0 filas anómalas, sin error
        $r = $this->withHeaders(['Authorization' => 'Bearer ' . $this->comoAdmin()])
            ->get('api/v1/auditoria?entidad=' . urlencode("unidades' OR 1=1 -- "));
        $r->assertStatus(200);
        $this->assertSame([], $this->json($r)['data']);

        // Numéricos casteados: la unidad "1 OR 1=1" no devuelve todo el catálogo
        $r = $this->withHeaders(['Authorization' => 'Bearer ' . $this->comoAdmin()])
            ->get('api/v1/diesel?unidad_id=' . urlencode('1 OR 1=1'));
        $r->assertStatus(200);
        foreach ($this->json($r)['data'] as $carga) {
            $this->assertSame(1, (int) $carga['unidad_id']);
        }
    }

    // ---- A03: XSS almacenado (la API guarda verbatim; el SPA renderiza inerte) ----

    public function testXssAlmacenadoViajaEscapableYNoSeEjecutaEnLaApi(): void
    {
        $payload = "<script>alert('xss')</script>Frenos";

        $r = $this->withHeaders(['Authorization' => 'Bearer ' . $this->comoTaller()])
            ->withBodyFormat('json')
            ->post('api/v1/taller', [
                'unidad_id'     => 1,
                'fecha_ingreso' => '2026-07-08',
                'diagnostico'   => $payload,
                'criticidad'    => 'Media',
            ]);
        $r->assertStatus(201);

        // Almacenado tal cual (sin "sanitizar" con pérdida) y servido como JSON
        // con Content-Type application/json: el navegador no lo interpreta
        $this->seeInDatabase('registros_taller', ['diagnostico' => $payload]);
        $lista = $this->withHeaders(['Authorization' => 'Bearer ' . $this->comoTaller()])
            ->get('api/v1/taller');
        $lista->assertStatus(200);
        $this->assertStringContainsString('application/json', $lista->response()->getHeaderLine('Content-Type'));
    }

    // ---- A05: cabeceras de seguridad en toda respuesta de la API ----

    public function testCabecerasDeSeguridadPresentes(): void
    {
        // Primero sin token: las cabeceras deben acompañar también a los errores
        // (withHeaders persiste en el método, por eso este caso va antes)
        $sinToken = $this->get('api/v1/unidades');
        $sinToken->assertStatus(401);
        $this->assertSame('nosniff', $sinToken->response()->getHeaderLine('X-Content-Type-Options'));

        $r = $this->withHeaders(['Authorization' => 'Bearer ' . $this->comoAdmin()])
            ->get('api/v1/unidades');
        $r->assertStatus(200);

        $respuesta = $r->response();
        $this->assertSame('nosniff', $respuesta->getHeaderLine('X-Content-Type-Options'));
        $this->assertSame('DENY', $respuesta->getHeaderLine('X-Frame-Options'));
        $this->assertSame('no-referrer', $respuesta->getHeaderLine('Referrer-Policy'));
        $this->assertStringContainsString("default-src 'none'", $respuesta->getHeaderLine('Content-Security-Policy'));
    }

    // ---- A04/A07: rate limit en endpoints mutantes ----

    public function testRateLimitEnMutantesEs429(): void
    {
        // El throttler usa caché de archivo persistente entre tests. Se limpia
        // y, por si acaso, se resetea explícitamente el bucket de Héctor para
        // que la medición arranque desde cero sin contaminación de otros tests.
        cache()->clean();
        $hectorId = (int) $this->db->table('usuarios')->where('email', 'hector@warhorse.mx')->get()->getRowArray()['id'];
        service('throttler')->remove('mut-actor-' . $hectorId);

        $tokenHector = $this->token('hector@warhorse.mx');

        // Ráfaga amplia (>60) de mutaciones inválidas: el límite de 60/min debe
        // dispararse dentro de la ventana; las válidas antes del tope son 422.
        $vio429     = false;
        $vioOtro    = false;
        for ($i = 0; $i < 75; $i++) {
            $r = $this->withHeaders(['Authorization' => 'Bearer ' . $tokenHector])
                ->withBodyFormat('json')
                ->post('api/v1/taller', ['unidad_id' => 0]);
            $codigo = $r->response()->getStatusCode();
            if ($codigo === 429) {
                $vio429 = true;
                break;
            }
            if ($codigo !== 422) {
                $vioOtro = true;
            }
        }

        $this->assertFalse($vioOtro, 'Antes del tope, toda mutación inválida debe ser 422');
        $this->assertTrue($vio429, 'El límite de tasa (60/min) nunca se alcanzó en 75 intentos');
    }
}
