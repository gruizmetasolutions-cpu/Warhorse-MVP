<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Database\Seeds\InitialSeeder;
use CodeIgniter\Test\CIUnitTestCase;
use CodeIgniter\Test\DatabaseTestTrait;
use CodeIgniter\Test\FeatureTestTrait;

/**
 * Alta de usuario sin correo: contraseña temporal entregada en el alta,
 * cambio obligatorio en el primer login y enforcement server-side.
 */
final class CambioPasswordTest extends CIUnitTestCase
{
    use DatabaseTestTrait;
    use FeatureTestTrait;

    protected $migrate     = true;
    protected $migrateOnce = true;
    protected $refresh     = true;
    protected $namespace   = null;
    protected $seed        = InitialSeeder::class;
    protected $seedOnce    = true;

    private static ?string $tokenAdmin = null;

    private function login(string $email, string $password = 'warhorse-demo'): \CodeIgniter\Test\TestResponse
    {
        return $this->withBodyFormat('json')->post('api/v1/auth/login', ['email' => $email, 'password' => $password]);
    }

    private function comoAdmin(): string
    {
        if (self::$tokenAdmin === null) {
            $r = $this->login('direccion@warhorse.mx');
            $r->assertStatus(200);
            self::$tokenAdmin = (string) $this->json($r)['token'];
        }

        return self::$tokenAdmin;
    }

    /**
     * @return array<string, mixed>
     */
    private function json(\CodeIgniter\Test\TestResponse $r): array
    {
        return (array) json_decode((string) $r->response()->getBody(), true);
    }

    /**
     * Da de alta un usuario nuevo y devuelve [email, password_temporal].
     *
     * @return array{0: string, 1: string}
     */
    private function altaNueva(string $email): array
    {
        $r = $this->withHeaders(['Authorization' => 'Bearer ' . $this->comoAdmin()])
            ->withBodyFormat('json')
            ->post('api/v1/usuarios', ['nombre' => 'Nuevo Usuario', 'email' => $email, 'rol' => 'taller']);
        $r->assertStatus(201);

        return [$email, (string) $this->json($r)['password_temporal']];
    }

    // ---- PW-2: el alta entrega la temporal y marca la obligación ----

    public function testAltaDevuelveTemporalYMarcaDebeCambiar(): void
    {
        [$email, $temporal] = $this->altaNueva('pw1@warhorse.mx');

        $this->assertNotSame('', $temporal);
        $this->assertGreaterThanOrEqual(8, strlen($temporal));
        $this->seeInDatabase('usuarios', ['email' => $email, 'debe_cambiar_password' => 1]);
    }

    // ---- PW-3: login y me exponen la bandera ----

    public function testLoginConTemporalExponeDebeCambiar(): void
    {
        [$email, $temporal] = $this->altaNueva('pw2@warhorse.mx');

        $sesion = $this->json($this->login($email, $temporal));
        $this->assertTrue((bool) $sesion['debe_cambiar_password']);

        $me = $this->json(
            $this->withHeaders(['Authorization' => 'Bearer ' . $sesion['token']])->get('api/v1/auth/me'),
        );
        $this->assertTrue((bool) $me['debe_cambiar_password']);
    }

    public function testUsuariosSembradosNoDebenCambiar(): void
    {
        $sesion = $this->json($this->login('edgar@warhorse.mx'));
        $this->assertFalse((bool) $sesion['debe_cambiar_password']);
    }

    // ---- PW-4: enforcement server-side ----

    public function testConTemporalTodoEs403SalvoCambioYLogout(): void
    {
        [$email, $temporal] = $this->altaNueva('pw3@warhorse.mx');
        $token = (string) $this->json($this->login($email, $temporal))['token'];

        // Cualquier ruta del Hub queda bloqueada
        $this->withHeaders(['Authorization' => 'Bearer ' . $token])
            ->get('api/v1/taller')->assertStatus(403);
        $this->withHeaders(['Authorization' => 'Bearer ' . $token])
            ->get('api/v1/unidades')->assertStatus(403);

        // El cambio de contraseña SÍ está permitido
        $this->withHeaders(['Authorization' => 'Bearer ' . $token])
            ->withBodyFormat('json')
            ->patch('api/v1/auth/password', ['password_actual' => $temporal, 'password_nueva' => 'nuevaClave123'])
            ->assertStatus(200);
    }

    // ---- PW-3: cambio de contraseña ----

    public function testCambioExitosoLiberaElAccesoYMataLaTemporal(): void
    {
        [$email, $temporal] = $this->altaNueva('pw4@warhorse.mx');
        $token = (string) $this->json($this->login($email, $temporal))['token'];

        $r = $this->withHeaders(['Authorization' => 'Bearer ' . $token])
            ->withBodyFormat('json')
            ->patch('api/v1/auth/password', ['password_actual' => $temporal, 'password_nueva' => 'miClaveSegura9']);
        $r->assertStatus(200);

        $this->seeInDatabase('usuarios', ['email' => $email, 'debe_cambiar_password' => 0]);
        $this->seeInDatabase('auditoria', ['entidad' => 'usuarios', 'accion' => 'usuario.password']);

        // La nueva contraseña permite login sin exigir cambio
        $sesion = $this->json($this->login($email, 'miClaveSegura9'));
        $this->assertFalse((bool) $sesion['debe_cambiar_password']);
        // El nuevo token ya no está bloqueado
        $this->withHeaders(['Authorization' => 'Bearer ' . $sesion['token']])
            ->get('api/v1/taller')->assertStatus(200);

        // La temporal ya no sirve
        $this->login($email, $temporal)->assertStatus(401);
    }

    public function testCambioConActualIncorrectaEs401(): void
    {
        [$email, $temporal] = $this->altaNueva('pw5@warhorse.mx');
        $token = (string) $this->json($this->login($email, $temporal))['token'];

        $this->withHeaders(['Authorization' => 'Bearer ' . $token])
            ->withBodyFormat('json')
            ->patch('api/v1/auth/password', ['password_actual' => 'equivocada', 'password_nueva' => 'otraClave123'])
            ->assertStatus(401);

        // Sigue bloqueado
        $this->seeInDatabase('usuarios', ['email' => $email, 'debe_cambiar_password' => 1]);
    }

    public function testNuevaMenorAOchoEs422(): void
    {
        [$email, $temporal] = $this->altaNueva('pw6@warhorse.mx');
        $token = (string) $this->json($this->login($email, $temporal))['token'];

        $this->withHeaders(['Authorization' => 'Bearer ' . $token])
            ->withBodyFormat('json')
            ->patch('api/v1/auth/password', ['password_actual' => $temporal, 'password_nueva' => 'corta7'])
            ->assertStatus(422);
    }

    public function testCambioSinTokenEs401(): void
    {
        $this->withBodyFormat('json')
            ->patch('api/v1/auth/password', ['password_actual' => 'x', 'password_nueva' => 'yzxwvuts9'])
            ->assertStatus(401);
    }
}
