<?php

declare(strict_types=1);

namespace App\Controllers\Api\V1;

use App\Controllers\BaseController;
use App\Libraries\ActorActual;
use App\Libraries\Permisos;
use App\Libraries\RespuestasApi;
use App\Services\CuentaService;
use CodeIgniter\HTTP\ResponseInterface;

/**
 * Autenticación (doc 05 §2): login/logout/me. RF-AUTH-01..03.
 */
final class AuthController extends BaseController
{
    public function login(): ResponseInterface
    {
        $request = $this->request;
        $datos   = $request instanceof \CodeIgniter\HTTP\IncomingRequest
            ? (array) $request->getJSON(true)
            : [];

        if (! $this->validateData($datos, [
            'email'    => 'required|valid_email',
            'password' => 'required|string',
        ])) {
            $errores = $this->validator?->getErrors() ?? [];

            return RespuestasApi::error(422, 'validation', 'Datos de acceso incompletos.', array_map(static fn (string $e): array => [$e], $errores));
        }

        $email    = strtolower(trim((string) $datos['email']));
        $password = (string) $datos['password'];
        $generico = 'Credenciales inválidas.'; // nunca revela si falló usuario o contraseña (doc 04 §A07)

        $cuentas = new CuentaService();
        $usuario = $cuentas->activoPorEmail($email);
        if ($usuario === null) {
            return RespuestasApi::error(401, 'unauthenticated', $generico);
        }

        $proveedor = auth()->getProvider();
        $shield    = $proveedor->findByCredentials(['email' => $email]);
        if ($shield === null) {
            return RespuestasApi::error(401, 'unauthenticated', $generico);
        }

        $resultado = service('passwords')->verify($password, (string) $shield->password_hash);
        if (! $resultado) {
            return RespuestasApi::error(401, 'unauthenticated', $generico);
        }

        // Login exitoso: limpia el contador de fuerza bruta de esta IP+email
        service('throttler')->remove(\App\Filters\ThrottleLoginFilter::llaveDe($this->request));

        $token = $shield->generateAccessToken('spa');
        $rolString = (string) $usuario['rol'];
        $roles = array_filter(array_map('trim', explode(',', $rolString)));

        return $this->response->setStatusCode(200)->setJSON([
            'token'   => $token->raw_token,
            'usuario' => [
                'id'     => (int) $usuario['id'],
                'nombre' => (string) $usuario['nombre'],
                'rol'    => $rolString,
                'roles'  => $roles,
            ],
            'landing'               => Permisos::landing($roles),
            'debe_cambiar_password' => (bool) ($usuario['debe_cambiar_password'] ?? false),
        ]);
    }

    /**
     * Cambio de contraseña propio (alta sin correo): la persona entra con la
     * temporal y define aquí su contraseña. Exento del filtro password-vigente.
     */
    public function password(): ResponseInterface
    {
        $request = $this->request;
        $datos   = $request instanceof \CodeIgniter\HTTP\IncomingRequest ? (array) $request->getJSON(true) : [];

        if (! $this->validateData($datos, [
            'password_actual' => 'required|string',
            'password_nueva'  => 'required|string|min_length[8]',
        ])) {
            $errores = $this->validator?->getErrors() ?? [];

            return RespuestasApi::error(422, 'validation', 'La contraseña nueva debe tener al menos 8 caracteres.', array_map(static fn (string $e): array => [$e], $errores));
        }

        $usuario   = ActorActual::usuario();
        $proveedor = auth()->getProvider();
        $shield    = $proveedor->findByCredentials(['email' => (string) $usuario['email']]);
        if ($shield === null || ! service('passwords')->verify((string) $datos['password_actual'], (string) $shield->password_hash)) {
            return RespuestasApi::error(401, 'bad_credentials', 'La contraseña actual no es correcta.');
        }

        $db = db_connect();
        $db->transStart();

        $shield->password = (string) $datos['password_nueva'];
        $proveedor->save($shield);

        (new \App\Models\UsuarioModel())->update((int) $usuario['id'], ['debe_cambiar_password' => 0]);

        (new \App\Services\AuditoriaService())->registrar(
            $usuario,
            'usuario.password',
            'usuarios',
            (int) $usuario['id'],
            ['debe_cambiar_password' => true],
            ['debe_cambiar_password' => false],
        );

        $db->transComplete();

        return $this->response->setStatusCode(200)->setJSON(['debe_cambiar_password' => false]);
    }

    public function logout(): ResponseInterface
    {
        try {
            $autorizacion = (string) $this->request->getHeaderLine('Authorization');
            $crudo        = trim(str_ireplace('Bearer', '', $autorizacion));

            $usuario = ActorActual::usuario();
            if ($usuario !== null && isset($usuario['email'])) {
                $shield = auth()->getProvider()->findByCredentials(['email' => (string) $usuario['email']]);
                if ($shield !== null && $crudo !== '') {
                    $shield->revokeAccessToken($crudo);
                }
            }
        } catch (\Throwable) {
            // Ignorar para garantizar cierre de sesión limpio en el cliente
        }

        return $this->response->setStatusCode(204);
    }

    public function me(): ResponseInterface
    {
        $usuario = ActorActual::usuario();
        $roles   = ActorActual::roles();

        return $this->response->setJSON([
            'id'                    => (int) $usuario['id'],
            'nombre'                => (string) $usuario['nombre'],
            'rol'                   => implode(',', $roles),
            'roles'                 => $roles,
            'permisos'              => Permisos::deRoles($roles),
            'landing'               => Permisos::landing($roles),
            'debe_cambiar_password' => (bool) ($usuario['debe_cambiar_password'] ?? false),
        ]);
    }
}
