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
        $rol   = (string) $usuario['rol'];

        return $this->response->setStatusCode(200)->setJSON([
            'token'   => $token->raw_token,
            'usuario' => [
                'id'     => (int) $usuario['id'],
                'nombre' => (string) $usuario['nombre'],
                'rol'    => $rol,
            ],
            'landing' => Permisos::landing($rol),
        ]);
    }

    public function logout(): ResponseInterface
    {
        $autorizacion = (string) $this->request->getHeaderLine('Authorization');
        $crudo        = trim(str_ireplace('Bearer', '', $autorizacion));

        $usuario = ActorActual::usuario();
        $shield  = auth()->getProvider()->findByCredentials(['email' => (string) $usuario['email']]);
        if ($shield !== null && $crudo !== '') {
            $shield->revokeAccessToken($crudo);
        }

        return $this->response->setStatusCode(204);
    }

    public function me(): ResponseInterface
    {
        $usuario = ActorActual::usuario();
        $rol     = (string) $usuario['rol'];

        return $this->response->setJSON([
            'id'       => (int) $usuario['id'],
            'nombre'   => (string) $usuario['nombre'],
            'rol'      => $rol,
            'permisos' => Permisos::deRol($rol),
            'landing'  => Permisos::landing($rol),
        ]);
    }
}
