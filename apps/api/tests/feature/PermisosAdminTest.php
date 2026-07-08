<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Database\Seeds\InitialSeeder;
use CodeIgniter\Test\CIUnitTestCase;
use CodeIgniter\Test\DatabaseTestTrait;
use CodeIgniter\Test\FeatureTestTrait;

/**
 * "Admin todo" (RF-USR-03): Dirección puede ejecutar también las acciones
 * operativas que ve en su menú (crear requisición, ingresar/liberar taller,
 * avanzar compras, registrar diésel), no solo los roles operativos.
 */
final class PermisosAdminTest extends CIUnitTestCase
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

    protected function tearDown(): void
    {
        parent::tearDown();
        $_FILES = [];
    }

    private function comoAdmin(): string
    {
        if (self::$tokenAdmin === null) {
            $r = $this->withBodyFormat('json')->post('api/v1/auth/login', ['email' => 'direccion@warhorse.mx', 'password' => 'warhorse-demo']);
            $r->assertStatus(200);
            self::$tokenAdmin = (string) json_decode((string) $r->response()->getBody(), true)['token'];
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

    private function idUnidad(string $idUnidad): int
    {
        $fila = $this->db->table('unidades')->where('id_unidad', $idUnidad)->get()->getRowArray();
        $this->assertIsArray($fila);

        return (int) $fila['id'];
    }

    private function conFoto(): void
    {
        $ruta = tempnam(sys_get_temp_dir(), 'foto');
        $img  = imagecreatetruecolor(4, 4);
        imagejpeg($img, (string) $ruta);
        $archivos = [
            'foto_pieza' => ['name' => 'pieza.jpg', 'type' => 'image/jpeg', 'tmp_name' => (string) $ruta, 'error' => UPLOAD_ERR_OK, 'size' => (int) filesize((string) $ruta)],
        ];
        $_FILES = $archivos;
        service('superglobals')->setFilesArray($archivos);
    }

    public function testAdminRegistraIngresoDeTaller(): void
    {
        $r = $this->withHeaders(['Authorization' => 'Bearer ' . $this->comoAdmin()])
            ->withBodyFormat('json')
            ->post('api/v1/taller', [
                'unidad_id'     => $this->idUnidad('WH210'),
                'fecha_ingreso' => '2026-07-08',
                'diagnostico'   => 'Ingreso capturado por Dirección',
                'criticidad'    => 'Media',
            ]);
        $r->assertStatus(201);
    }

    public function testAdminLiberaUnaUnidad(): void
    {
        $id = (int) $this->json(
            $this->withHeaders(['Authorization' => 'Bearer ' . $this->comoAdmin()])
                ->withBodyFormat('json')
                ->post('api/v1/taller', ['unidad_id' => $this->idUnidad('WH118'), 'fecha_ingreso' => '2026-07-08', 'diagnostico' => 'Para liberar por admin', 'criticidad' => 'Media']),
        )['id'];

        $this->withHeaders(['Authorization' => 'Bearer ' . $this->comoAdmin()])
            ->withBodyFormat('json')
            ->patch("api/v1/taller/{$id}/liberar", ['tipo_liberacion' => 'Total', 'fecha_salida' => '2026-07-09', 'costo_taller' => 1200.00])
            ->assertStatus(200);
    }

    public function testAdminRegistraCargaDeDiesel(): void
    {
        $this->withHeaders(['Authorization' => 'Bearer ' . $this->comoAdmin()])
            ->withBodyFormat('json')
            ->post('api/v1/diesel', [
                'unidad_id'     => $this->idUnidad('WH101'),
                'fecha'         => '2026-07-08',
                'litros'        => 150.0,
                'costo_total'   => 3800.00,
                'km_recorridos' => 300,
            ])
            ->assertStatus(201);
    }

    public function testAdminCreaUnaRequisicionDeCompra(): void
    {
        $this->conFoto();
        $r = $this->withHeaders(['Authorization' => 'Bearer ' . $this->comoAdmin()])
            ->post('api/v1/requisiciones', [
                'unidad_destino_id' => $this->idUnidad('WH210'),
                'origen'            => 'Compra',
                'descripcion_pieza' => 'Filtro capturado por Dirección',
                'urgencia'          => 'Media',
            ]);
        $r->assertStatus(201);
    }

    public function testAdminAvanzaUnaRequisicionEnCompras(): void
    {
        // La requisición 'Balatas de freno' del seed está en Cotizado
        $fila = $this->db->table('requisiciones')->where('descripcion_pieza', 'Balatas de freno')->get()->getRowArray();
        $this->assertIsArray($fila);

        $this->withHeaders(['Authorization' => 'Bearer ' . $this->comoAdmin()])
            ->withBodyFormat('json')
            ->patch("api/v1/compras/requisiciones/{$fila['id']}/estado", ['estado' => 'Comprado', 'costo_real' => 1850.00, 'numero_factura' => 'F-ADMIN-1'])
            ->assertStatus(200);
    }
}
