<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Database\Seeds\InitialSeeder;
use CodeIgniter\Test\CIUnitTestCase;
use CodeIgniter\Test\DatabaseTestTrait;
use CodeIgniter\Test\FeatureTestTrait;

/**
 * Sprint 3 — doc 06 §2.4 (valorización en cascada, foto obligatoria) y
 * §2.10 (upload malicioso, integridad del origen del estimado, IDOR).
 */
final class RequisicionesTest extends CIUnitTestCase
{
    use DatabaseTestTrait;
    use FeatureTestTrait;

    protected $migrate     = true;
    protected $migrateOnce = true;
    protected $refresh     = true;
    protected $namespace   = null;
    protected $seed        = InitialSeeder::class;
    protected $seedOnce    = true;

    private static ?string $tokenTaller  = null;
    private static ?string $tokenTaller2 = null;
    private static ?string $tokenCompras = null;

    protected function tearDown(): void
    {
        parent::tearDown();
        $_FILES = [];
    }

    private function token(string $email): string
    {
        $respuesta = $this->withBodyFormat('json')->post('api/v1/auth/login', [
            'email'    => $email,
            'password' => 'warhorse-demo',
        ]);
        $respuesta->assertStatus(200);
        $json = json_decode((string) $respuesta->response()->getBody(), true);

        return (string) $json['token'];
    }

    private function comoTaller(): string
    {
        return self::$tokenTaller ??= $this->token('edgar@warhorse.mx');
    }

    private function comoTaller2(): string
    {
        return self::$tokenTaller2 ??= $this->token('hector@warhorse.mx');
    }

    private function comoCompras(): string
    {
        return self::$tokenCompras ??= $this->token('montzay@warhorse.mx');
    }

    /**
     * Simula la subida multipart de una foto (JPEG válido por defecto).
     */
    private function conFoto(bool $valida = true, string $nombre = 'pieza.jpg'): void
    {
        $ruta = tempnam(sys_get_temp_dir(), 'foto');
        if ($ruta === false) {
            $this->fail('No se pudo crear el archivo temporal.');
        }

        if ($valida) {
            // JPEG mínimo real (magic bytes) para que la validación MIME pase
            $img = imagecreatetruecolor(4, 4);
            $this->assertNotFalse($img);
            imagejpeg($img, $ruta);
        } else {
            file_put_contents($ruta, "<?php system('id'); ?>");
        }

        $archivos = [
            'foto_pieza' => [
                'name'     => $nombre,
                'type'     => $valida ? 'image/jpeg' : 'application/x-php',
                'tmp_name' => $ruta,
                'error'    => UPLOAD_ERR_OK,
                'size'     => (int) filesize($ruta),
            ],
        ];
        $_FILES = $archivos;
        // El servicio Superglobals toma un snapshot de $_FILES al construirse
        service('superglobals')->setFilesArray($archivos);
    }

    /**
     * @param array<string, mixed> $campos
     */
    private function crear(array $campos, string $token, bool $conFoto = true, bool $fotoValida = true): \CodeIgniter\Test\TestResponse
    {
        if ($conFoto) {
            $this->conFoto($fotoValida, $fotoValida ? 'pieza.jpg' : 'shell.php');
        } else {
            $_FILES = [];
            service('superglobals')->setFilesArray([]);
        }

        return $this->withHeaders(['Authorization' => "Bearer {$token}"])
            ->post('api/v1/requisiciones', $campos);
    }

    /**
     * @return array<string, mixed>
     */
    private function json(\CodeIgniter\Test\TestResponse $respuesta): array
    {
        return (array) json_decode((string) $respuesta->response()->getBody(), true);
    }

    private function idUnidad(string $idUnidad): int
    {
        $fila = $this->db->table('unidades')->where('id_unidad', $idUnidad)->get()->getRowArray();
        $this->assertIsArray($fila);

        return (int) $fila['id'];
    }

    // ---- doc 06 §2.4: cascada de valorización (ADR-002) ----

    public function testYonkeConHistoricoDeCompraUsaUltimaCompra(): void
    {
        // El seed tiene "Kit de clutch" comprado con costo_real = 6400 (factura F-10233)
        $respuesta = $this->crear([
            'unidad_destino_id' => $this->idUnidad('WH101'),
            'origen'            => 'Yonke',
            'unidad_donante_id' => $this->idUnidad('WH03'),
            'descripcion_pieza' => 'Kit de clutch',
            'urgencia'          => 'Media',
        ], $this->comoTaller());

        $respuesta->assertStatus(201);
        $json = $this->json($respuesta);
        $this->assertSame(6400.0, (float) $json['costo_estimado']);
        $this->assertSame('ultima_compra', $json['origen_costo_estimado']);
        $this->assertSame('Solicitado', $json['estado']);
    }

    public function testYonkeSinHistoricoPeroEnCatalogoUsaCatalogo(): void
    {
        // "Alternador" nunca se ha comprado (solo Yonke estimado) pero está en catálogo a 3200
        $respuesta = $this->crear([
            'unidad_destino_id' => $this->idUnidad('WH101'),
            'origen'            => 'Yonke',
            'unidad_donante_id' => $this->idUnidad('WH60'),
            'descripcion_pieza' => 'Alternador',
            'urgencia'          => 'Media',
        ], $this->comoTaller());

        $respuesta->assertStatus(201);
        $json = $this->json($respuesta);
        $this->assertSame(3200.0, (float) $json['costo_estimado']);
        $this->assertSame('catalogo', $json['origen_costo_estimado']);
    }

    public function testYonkeSinHistoricoNiCatalogoExigeManual(): void
    {
        $campos = [
            'unidad_destino_id' => $this->idUnidad('WH104'),
            'origen'            => 'Yonke',
            'unidad_donante_id' => $this->idUnidad('WH03'),
            'descripcion_pieza' => 'Radiador especial de importación',
            'urgencia'          => 'Crítica',
        ];

        // Sin costo manual → 422 (A y C fallan)
        $sinCosto = $this->crear($campos, $this->comoTaller());
        $sinCosto->assertStatus(422);
        $this->assertArrayHasKey('costo_estimado_manual', $this->json($sinCosto)['fields']);

        // Con costo manual > 0 → 201 marcado 'manual'
        $conCosto = $this->crear($campos + ['costo_estimado_manual' => 1500], $this->comoTaller());
        $conCosto->assertStatus(201);
        $json = $this->json($conCosto);
        $this->assertSame(1500.0, (float) $json['costo_estimado']);
        $this->assertSame('manual', $json['origen_costo_estimado']);
    }

    public function testYonkeConCostoCeroForzadoEs422(): void
    {
        $respuesta = $this->crear([
            'unidad_destino_id'     => $this->idUnidad('WH104'),
            'origen'                => 'Yonke',
            'unidad_donante_id'     => $this->idUnidad('WH03'),
            'descripcion_pieza'     => 'Pieza inexistente en catálogo XYZ',
            'urgencia'              => 'Media',
            'costo_estimado_manual' => 0,
        ], $this->comoTaller());

        $respuesta->assertStatus(422);
    }

    public function testYonkeSinDonanteEs422(): void
    {
        $respuesta = $this->crear([
            'unidad_destino_id' => $this->idUnidad('WH101'),
            'origen'            => 'Yonke',
            'descripcion_pieza' => 'Turbo',
            'urgencia'          => 'Media',
        ], $this->comoTaller());

        $respuesta->assertStatus(422);
        $this->assertArrayHasKey('unidad_donante_id', $this->json($respuesta)['fields']);
    }

    public function testDonanteQueNoEsYonkeEs409(): void
    {
        $this->crear([
            'unidad_destino_id' => $this->idUnidad('WH104'),
            'origen'            => 'Yonke',
            'unidad_donante_id' => $this->idUnidad('WH101'), // Activo, no Yonke
            'descripcion_pieza' => 'Turbo',
            'urgencia'          => 'Media',
        ], $this->comoTaller())->assertStatus(409);
    }

    public function testSinFotoEs422(): void
    {
        $respuesta = $this->crear([
            'unidad_destino_id' => $this->idUnidad('WH101'),
            'origen'            => 'Compra',
            'descripcion_pieza' => 'Balatas de freno',
            'urgencia'          => 'Media',
        ], $this->comoTaller(), conFoto: false);

        $respuesta->assertStatus(422);
        $this->assertArrayHasKey('foto_pieza', $this->json($respuesta)['fields']);
    }

    public function testSinUnidadDestinoEs422(): void
    {
        $respuesta = $this->crear([
            'origen'            => 'Compra',
            'descripcion_pieza' => 'Balatas de freno',
            'urgencia'          => 'Media',
        ], $this->comoTaller());

        $respuesta->assertStatus(422);
        $this->assertArrayHasKey('unidad_destino_id', $this->json($respuesta)['fields']);
    }

    public function testRolNoTallerEs403(): void
    {
        $this->crear([
            'unidad_destino_id' => $this->idUnidad('WH101'),
            'origen'            => 'Compra',
            'descripcion_pieza' => 'Balatas de freno',
        ], $this->comoCompras())->assertStatus(403);
    }

    // ---- doc 06 §2.10 (A08) ----

    public function testSubirPhpDisfrazadoDeFotoEsRechazado(): void
    {
        $respuesta = $this->crear([
            'unidad_destino_id' => $this->idUnidad('WH101'),
            'origen'            => 'Compra',
            'descripcion_pieza' => 'Balatas de freno',
            'urgencia'          => 'Media',
        ], $this->comoTaller(), fotoValida: false);

        $respuesta->assertStatus(422);
    }

    public function testOrigenCostoEstimadoDelClienteEsIgnorado(): void
    {
        // El cliente intenta falsear la confiabilidad del estimado (A08):
        // pide 'ultima_compra' para una pieza que resuelve por catálogo
        $respuesta = $this->crear([
            'unidad_destino_id'     => $this->idUnidad('WH101'),
            'origen'                => 'Yonke',
            'unidad_donante_id'     => $this->idUnidad('WH60'),
            'descripcion_pieza'     => 'Alternador',
            'urgencia'              => 'Media',
            'origen_costo_estimado' => 'ultima_compra',
            'costo_estimado'        => 1,
        ], $this->comoTaller());

        $respuesta->assertStatus(201);
        $json = $this->json($respuesta);
        $this->assertSame('catalogo', $json['origen_costo_estimado']);
        $this->assertSame(3200.0, (float) $json['costo_estimado']);
    }

    public function testLaFotoSeGuardaFueraDelWebrootYLaNotificacionSeEncola(): void
    {
        $antes = (int) ($this->db->table('queue_jobs')->countAllResults());

        $respuesta = $this->crear([
            'unidad_destino_id' => $this->idUnidad('WH210'),
            'origen'            => 'Compra',
            'descripcion_pieza' => 'Turbo',
            'urgencia'          => 'Rápida',
        ], $this->comoTaller());

        $respuesta->assertStatus(201);
        $json = $this->json($respuesta);

        // Fuera del webroot: nombre aleatorio bajo writable/uploads, nunca public/
        $this->assertMatchesRegularExpression('/^[a-f0-9]{32}\.jpg$/', (string) $json['foto_pieza_url']);
        $this->assertFileExists(WRITEPATH . 'uploads/requisiciones/' . $json['foto_pieza_url']);
        $this->assertFileDoesNotExist(FCPATH . 'uploads/' . $json['foto_pieza_url']);

        // RF-REQ-06: notificación a Compras encolada, no bloqueante
        $this->assertSame($antes + 1, (int) $this->db->table('queue_jobs')->countAllResults());
    }

    // ---- Policy anti-IDOR (doc 04 §A01) ----

    public function testTallerSoloVeSusRequisiciones(): void
    {
        // Héctor (taller) no ha creado ninguna; las del seed son de Edgar
        $deHector = $this->json(
            $this->withHeaders(['Authorization' => 'Bearer ' . $this->comoTaller2()])
                ->get('api/v1/requisiciones'),
        );
        $this->assertSame([], $deHector['data']);

        $deEdgar = $this->json(
            $this->withHeaders(['Authorization' => 'Bearer ' . $this->comoTaller()])
                ->get('api/v1/requisiciones'),
        );
        $this->assertNotSame([], $deEdgar['data']);

        // Compras ve todas
        $deCompras = $this->json(
            $this->withHeaders(['Authorization' => 'Bearer ' . $this->comoCompras()])
                ->get('api/v1/requisiciones'),
        );
        $this->assertGreaterThanOrEqual(count($deEdgar['data']), count($deCompras['data']));
    }

    public function testFotoDeOtroTallerEs403(): void
    {
        $reqDeEdgar = $this->db->table('requisiciones')->get()->getRowArray();
        $this->assertIsArray($reqDeEdgar);

        $this->withHeaders(['Authorization' => 'Bearer ' . $this->comoTaller2()])
            ->get('api/v1/requisiciones/' . $reqDeEdgar['id'] . '/foto')
            ->assertStatus(403);
    }
}
