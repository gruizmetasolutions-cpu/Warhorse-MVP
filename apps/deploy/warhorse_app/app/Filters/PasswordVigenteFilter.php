<?php

declare(strict_types=1);

namespace App\Filters;

use App\Libraries\ActorActual;
use App\Libraries\RespuestasApi;
use CodeIgniter\Filters\FilterInterface;
use CodeIgniter\HTTP\RequestInterface;
use CodeIgniter\HTTP\ResponseInterface;

/**
 * Enforcement del cambio obligatorio de contraseña (alta sin correo). Corre
 * DESPUÉS de api-auth: si el usuario aún debe cambiar su temporal, bloquea
 * toda ruta con 403. Las rutas exentas (cambio de contraseña y logout) NO
 * llevan este filtro, así que la persona siempre puede definir su clave.
 */
class PasswordVigenteFilter implements FilterInterface
{
    public function before(RequestInterface $request, $arguments = null)
    {
        try {
            $usuario = ActorActual::usuario();
        } catch (\RuntimeException) {
            return null; // sin actor lo maneja api-auth
        }

        if ((bool) ($usuario['debe_cambiar_password'] ?? false)) {
            return RespuestasApi::error(403, 'password_change_required', 'Debes definir tu contraseña antes de continuar.');
        }

        return null;
    }

    public function after(RequestInterface $request, ResponseInterface $response, $arguments = null)
    {
        return null;
    }
}
