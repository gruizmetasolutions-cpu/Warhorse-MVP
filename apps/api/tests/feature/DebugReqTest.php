<?php
namespace Tests\Feature;
use App\Database\Seeds\InitialSeeder;
use CodeIgniter\Test\CIUnitTestCase;
use CodeIgniter\Test\DatabaseTestTrait;
use CodeIgniter\Test\FeatureTestTrait;
final class DebugReqTest extends CIUnitTestCase
{
    use DatabaseTestTrait; use FeatureTestTrait;
    protected $migrate = true; protected $migrateOnce = true; protected $refresh = true; protected $namespace = null;
    protected $seed = InitialSeeder::class; protected $seedOnce = true;
    public function testDebug(): void
    {
        $login = $this->withBodyFormat('json')->post('api/v1/auth/login', ['email' => 'edgar@warhorse.mx', 'password' => 'warhorse-demo']);
        $token = json_decode((string) $login->response()->getBody(), true)['token'];
        $ruta = tempnam(sys_get_temp_dir(), 'foto');
        $img = imagecreatetruecolor(4, 4); imagejpeg($img, $ruta);
        $_FILES = ['foto_pieza' => ['name' => 'pieza.jpg', 'type' => 'image/jpeg', 'tmp_name' => $ruta, 'error' => 0, 'size' => (int) filesize($ruta)]];
        $unidad = $this->db->table('unidades')->where('id_unidad', 'WH101')->get()->getRowArray();
        $donante = $this->db->table('unidades')->where('id_unidad', 'WH60')->get()->getRowArray();
        $r = $this->withHeaders(['Authorization' => "Bearer {$token}"])->post('api/v1/requisiciones', [
            'unidad_destino_id' => $unidad['id'], 'origen' => 'Yonke', 'unidad_donante_id' => $donante['id'],
            'descripcion_pieza' => 'Alternador', 'urgencia' => 'Media',
        ]);
        fwrite(STDERR, "\nSTATUS: " . $r->response()->getStatusCode() . "\nBODY: " . (string) $r->response()->getBody() . "\n");
        $this->assertTrue(true);
    }
}
