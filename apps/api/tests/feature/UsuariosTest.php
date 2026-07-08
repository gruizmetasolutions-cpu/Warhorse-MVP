<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Database\Seeds\InitialSeeder;
use CodeIgniter\Test\CIUnitTestCase;
use CodeIgniter\Test\DatabaseTestTrait;
use CodeIgniter\Test\FeatureTestTrait;

/**
 * Sprint 6 — RF-USR-01/02/03 (doc 05 §9): administración de usuarios por
 * Dirección, con credenciales temporales por correo (cola) y suspensión
 * efectiva de inmediato.
 */
final class UsuariosTest extends CIUnitTestCase
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

    private function token(string $email, string $password = 'warhorse-demo'): string
    {
        $r = $this->login($email, $password);
        $r->assertStatus(200);

        return (string) json_decode((string) $r->response()->getBody(), true)['token'];
    }

    private function login(string $email, string $password = 'warhorse-demo'): \CodeIgniter\Test\TestResponse
    {
        return $this->withBodyFormat('json')->post('api/v1/auth/login', ['email' => $email, 'password' => $password]);
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

    /**
     * @param array<string, mixed> $datos
     */
    private function alta(array $datos, ?string $token = null): \CodeIgniter\Test\TestResponse
    {
        return $this->withHeaders(['Authorization' => 'Bearer ' . ($token ?? $this->comoAdmin())])
            ->withBodyFormat('json')
            ->post('api/v1/usuarios', $datos);
    }

    /**
     * @param array<string, mixed> $cambio
     */
    private function cambiar(int $id, array $cambio, ?string $token = null): \CodeIgniter\Test\TestResponse
    {
        return $this->withHeaders(['Authorization' => 'Bearer ' . ($token ?? $this->comoAdmin())])
            ->withBodyFormat('json')
            ->patch("api/v1/usuarios/{$id}", $cambio);
    }

    private function idUsuario(string $email): int
    {
        $fila = $this->db->table('usuarios')->where('email', $email)->get()->getRowArray();
        $this->assertIsArray($fila);

        return (int) $fila['id'];
    }

    // ---- RF-USR-01: listado y alta ----

    public function testListadoSoloAdminYSinHashes(): void
    {
        $r = $this->withHeaders(['Authorization' => 'Bearer ' . $this->comoAdmin()])
            ->get('api/v1/usuarios');
        $r->assertStatus(200);

        $data = $this->json($r)['data'];
        $this->assertNotSame([], $data);
        foreach (['id', 'nombre', 'email', 'rol', 'activo'] as $campo) {
            $this->assertArrayHasKey($campo, $data[0]);
        }
        $this->assertArrayNotHasKey('password_hash', $data[0]);

        $this->withHeaders(['Authorization' => 'Bearer ' . $this->comoTaller()])
            ->get('api/v1/usuarios')->assertStatus(403);
    }

    public function testAltaValidaEncolaCredencialesYPermiteLogin(): void
    {
        $r = $this->alta(['nombre' => 'Paola Ruiz', 'email' => 'paola@warhorse.mx', 'rol' => 'taller']);
        $r->assertStatus(201);

        $json = $this->json($r);
        $this->assertSame('Paola Ruiz', $json['nombre']);
        // La contraseña temporal viaja por correo, JAMÁS en la respuesta
        $this->assertArrayNotHasKey('password', $json);
        $this->assertArrayNotHasKey('password_temporal', $json);

        // Alta auditada (RF-INT-05)
        $this->seeInDatabase('auditoria', ['entidad' => 'usuarios', 'entidad_id' => $json['id'], 'accion' => 'usuario.alta']);

        // Correo de credenciales encolado (en dev el job lo escribe al log)
        $fila = $this->db->table('queue_jobs')->orderBy('id', 'DESC')->get()->getRowArray();
        $this->assertIsArray($fila);
        $payload = json_decode((string) $fila['payload'], true);
        $this->assertSame('correo-credenciales', $payload['job']);
        $this->assertSame('paola@warhorse.mx', $payload['data']['email']);

        // La contraseña temporal del correo permite iniciar sesión con su rol
        $temporal = (string) $payload['data']['password_temporal'];
        $this->assertNotSame('', $temporal);
        $sesion = $this->json($this->login('paola@warhorse.mx', $temporal));
        $this->assertSame('taller', $sesion['usuario']['rol']);
    }

    public function testAltaDuplicadaEs409(): void
    {
        $this->alta(['nombre' => 'Greisy Bis', 'email' => 'greisy@warhorse.mx', 'rol' => 'diesel'])
            ->assertStatus(409);
    }

    public function testAltaInvalidaEs422(): void
    {
        $this->alta(['nombre' => 'X', 'email' => 'no-es-correo', 'rol' => 'taller'])->assertStatus(422);
        $this->alta(['nombre' => 'X', 'email' => 'x@warhorse.mx', 'rol' => 'superadmin'])->assertStatus(422);
    }

    public function testAltaPorNoAdminConEscaladaEs403(): void
    {
        // §2.10 A01 escalada: payload con rol admin desde un token taller
        $this->alta(['nombre' => 'Intruso', 'email' => 'intruso@warhorse.mx', 'rol' => 'admin'], $this->comoTaller())
            ->assertStatus(403);
        $this->dontSeeInDatabase('usuarios', ['email' => 'intruso@warhorse.mx']);
    }

    // ---- RF-USR-01/02: suspensión y cambio de rol ----

    public function testSuspenderCortaElAccesoDeInmediatoYReactivarLoDevuelve(): void
    {
        $id          = $this->idUsuario('hector@warhorse.mx');
        $tokenHector = $this->token('hector@warhorse.mx');

        // Con token vigente, taller entra a su módulo
        $this->withHeaders(['Authorization' => 'Bearer ' . $tokenHector])
            ->get('api/v1/taller')->assertStatus(200);

        $this->cambiar($id, ['activo' => false])->assertStatus(200);
        $this->seeInDatabase('auditoria', ['entidad' => 'usuarios', 'entidad_id' => $id, 'accion' => 'usuario.suspendido']);

        // El token previo muere y el login queda bloqueado (RF-USR-01)
        $this->withHeaders(['Authorization' => 'Bearer ' . $tokenHector])
            ->get('api/v1/taller')->assertStatus(401);
        $this->login('hector@warhorse.mx')->assertStatus(401);

        $this->cambiar($id, ['activo' => true])->assertStatus(200);
        $this->seeInDatabase('auditoria', ['entidad' => 'usuarios', 'entidad_id' => $id, 'accion' => 'usuario.reactivado']);
        $this->login('hector@warhorse.mx')->assertStatus(200);
    }

    public function testCambioDeRolAjustaPermisosDeInmediato(): void
    {
        $id = $this->idUsuario('hector@warhorse.mx');

        $this->cambiar($id, ['rol' => 'compras'])->assertStatus(200);
        $this->seeInDatabase('auditoria', ['entidad' => 'usuarios', 'entidad_id' => $id, 'accion' => 'usuario.rol']);

        // RF-USR-02: el nuevo rol rige módulos y RBAC al instante
        $sesion = $this->json($this->login('hector@warhorse.mx'));
        $this->assertSame('compras', $sesion['usuario']['rol']);
        $this->assertSame('compras', $sesion['landing']);

        $tokenHector = (string) $sesion['token'];
        $this->withHeaders(['Authorization' => 'Bearer ' . $tokenHector])
            ->get('api/v1/compras/requisiciones')->assertStatus(200);
        $this->withHeaders(['Authorization' => 'Bearer ' . $tokenHector])
            ->withBodyFormat('json')
            ->post('api/v1/taller', ['unidad_id' => 1, 'fecha_ingreso' => '2026-07-08', 'diagnostico' => 'X', 'criticidad' => 'Media'])
            ->assertStatus(403);

        // De regreso a taller (seedOnce)
        $this->cambiar($id, ['rol' => 'taller'])->assertStatus(200);
    }

    public function testPatchInexistenteEs404YNoAdminEs403(): void
    {
        $this->cambiar(99999, ['activo' => false])->assertStatus(404);
        $this->cambiar($this->idUsuario('hector@warhorse.mx'), ['activo' => false], $this->comoTaller())->assertStatus(403);
    }
}
