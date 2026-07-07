<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Database\Seeds\InitialSeeder;
use CodeIgniter\Test\CIUnitTestCase;
use CodeIgniter\Test\DatabaseTestTrait;
use CodeIgniter\Test\FeatureTestTrait;

/**
 * Sprint 1 — doc 06 §2.1 (Autenticación) y §2.10 (seguridad de auth/RBAC).
 */
final class AuthTest extends CIUnitTestCase
{
    use DatabaseTestTrait;
    use FeatureTestTrait;

    protected $migrate     = true;
    protected $migrateOnce = true;
    protected $refresh     = true;
    protected $namespace   = null;
    protected $seed        = InitialSeeder::class;
    protected $seedOnce    = true;

    private function login(string $email, string $password = 'warhorse-demo'): \CodeIgniter\Test\TestResponse
    {
        return $this->withBodyFormat('json')->post('api/v1/auth/login', [
            'email'    => $email,
            'password' => $password,
        ]);
    }

    private function token(string $email): string
    {
        $respuesta = $this->login($email);
        $respuesta->assertStatus(200);
        $json = json_decode((string) $respuesta->response()->getBody(), true);

        return (string) $json['token'];
    }

    // ---- doc 06 §2.1 ----

    public function testLoginValidoDevuelveTokenYLandingPorRol(): void
    {
        $casos = [
            ['direccion@warhorse.mx', 'admin', 'dashboard'],
            ['edgar@warhorse.mx', 'taller', 'requisicion'],
            ['montzay@warhorse.mx', 'compras', 'compras'],
            ['greisy@warhorse.mx', 'diesel', 'diesel'],
        ];

        foreach ($casos as [$email, $rol, $landing]) {
            $respuesta = $this->login($email);
            $respuesta->assertStatus(200);
            $json = json_decode((string) $respuesta->response()->getBody(), true);
            $this->assertNotEmpty($json['token'], "Sin token para {$email}");
            $this->assertSame($rol, $json['usuario']['rol']);
            $this->assertSame($landing, $json['landing']);
        }
    }

    public function testLoginInvalidoEs401Generico(): void
    {
        $respuesta = $this->login('direccion@warhorse.mx', 'contraseña-mala');
        $respuesta->assertStatus(401);
        $json = json_decode((string) $respuesta->response()->getBody(), true);
        $this->assertSame('unauthenticated', $json['error']);
        // Mensaje genérico: no revela si falló usuario o contraseña
        $this->assertStringNotContainsString('contraseña', strtolower((string) $json['message']));
        $this->assertStringNotContainsString('usuario no', strtolower((string) $json['message']));
    }

    public function testUsuarioInexistenteEs401Generico(): void
    {
        $this->login('nadie@warhorse.mx')->assertStatus(401);
    }

    public function testUsuarioSuspendidoEs401(): void
    {
        // Karla Ortiz está sembrada con activo = 0
        $this->login('karla@warhorse.mx')->assertStatus(401);
    }

    public function testLoginSinCamposEs422(): void
    {
        $respuesta = $this->withBodyFormat('json')->post('api/v1/auth/login', ['email' => 'x@x.mx']);
        $respuesta->assertStatus(422);
        $json = json_decode((string) $respuesta->response()->getBody(), true);
        $this->assertSame('validation', $json['error']);
        $this->assertArrayHasKey('password', $json['fields']);
    }

    public function testFuerzaBrutaSextoIntentoEnUnMinutoEs429(): void
    {
        $email = 'fuerza-bruta@warhorse.mx';
        for ($i = 1; $i <= 5; $i++) {
            $this->login($email, 'mala')->assertStatus(401);
        }
        $this->login($email, 'mala')->assertStatus(429);
    }

    public function testLogoutRevocaElToken(): void
    {
        $token = $this->token('edgar@warhorse.mx');

        $this->withHeaders(['Authorization' => "Bearer {$token}"])
            ->post('api/v1/auth/logout')
            ->assertStatus(204);

        // Reusar el token revocado → 401 (RF-AUTH-03)
        $this->withHeaders(['Authorization' => "Bearer {$token}"])
            ->get('api/v1/auth/me')
            ->assertStatus(401);
    }

    public function testTokenExpiradoEs401(): void
    {
        $token = $this->token('montzay@warhorse.mx');

        // Envejecer el token más allá de la vida útil configurada
        $this->db->table('auth_identities')
            ->where('type', 'access_token')
            ->set('last_used_at', '2020-01-01 00:00:00')
            ->set('created_at', '2020-01-01 00:00:00')
            ->update();

        $this->withHeaders(['Authorization' => "Bearer {$token}"])
            ->get('api/v1/auth/me')
            ->assertStatus(401);
    }

    public function testRequestSinTokenEs401(): void
    {
        $this->get('api/v1/auth/me')->assertStatus(401);
    }

    public function testMeDevuelvePermisosDeLaMatrizPorRol(): void
    {
        $token = $this->token('edgar@warhorse.mx');

        $respuesta = $this->withHeaders(['Authorization' => "Bearer {$token}"])->get('api/v1/auth/me');
        $respuesta->assertStatus(200);
        $json = json_decode((string) $respuesta->response()->getBody(), true);

        $this->assertSame('taller', $json['rol']);
        $this->assertTrue($json['permisos']['requisicion']);
        $this->assertTrue($json['permisos']['catalogo']);
        $this->assertTrue($json['permisos']['taller']);
        $this->assertFalse($json['permisos']['dashboard']);
        $this->assertFalse($json['permisos']['compras']);
        $this->assertFalse($json['permisos']['usuarios']);
    }

    public function testUsuarioSuspendidoTrasEmitirTokenPierdeAcceso(): void
    {
        $token = $this->token('hector@warhorse.mx');

        $this->db->table('usuarios')->where('email', 'hector@warhorse.mx')->update(['activo' => 0]);

        $this->withHeaders(['Authorization' => "Bearer {$token}"])
            ->get('api/v1/auth/me')
            ->assertStatus(401);

        // restaurar para otros tests (seedOnce)
        $this->db->table('usuarios')->where('email', 'hector@warhorse.mx')->update(['activo' => 1]);
    }

    // ---- doc 06 §2.10 (A01/A07) ----

    public function testRbacRolSinPermisoEs403(): void
    {
        $rutas = service('routes');
        $rutas->get('api/v1/solo-admin', static fn () => service('response')->setJSON(['ok' => true]), [
            'filter' => ['api-auth', 'rbac:admin'],
        ]);

        $tokenTaller = $this->token('edgar@warhorse.mx');
        $this->withHeaders(['Authorization' => "Bearer {$tokenTaller}"])
            ->get('api/v1/solo-admin')
            ->assertStatus(403);

        $tokenAdmin = $this->token('direccion@warhorse.mx');
        $this->withHeaders(['Authorization' => "Bearer {$tokenAdmin}"])
            ->get('api/v1/solo-admin')
            ->assertStatus(200);
    }

    public function testEscaladaDeRolEnPayloadEsIgnorada(): void
    {
        $token = $this->token('edgar@warhorse.mx');

        // El rol SIEMPRE se resuelve server-side; el payload/query se ignora
        $respuesta = $this->withHeaders(['Authorization' => "Bearer {$token}"])
            ->get('api/v1/auth/me?rol=admin');

        $respuesta->assertStatus(200);
        $json = json_decode((string) $respuesta->response()->getBody(), true);
        $this->assertSame('taller', $json['rol']);
    }
}
