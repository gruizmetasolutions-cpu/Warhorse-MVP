<?php

declare(strict_types=1);

namespace App\Filters;

use App\Libraries\ActorActual;
use App\Libraries\RespuestasApi;
use CodeIgniter\Filters\FilterInterface;
use CodeIgniter\HTTP\RequestInterface;
use CodeIgniter\HTTP\ResponseInterface;

/**
 * Filtro `rbac:<rol>[,rol2]` (doc 04 §A01): autoriza por rol de dominio,
 * re-verificado server-side. Corre después de api-auth.
 */
class RbacFilter implements FilterInterface
{
    public function before(RequestInterface $request, $arguments = null)
    {
        $rolesPermitidos = is_array($arguments) ? $arguments : [];

        try {
            $rol = ActorActual::rol();
        } catch (\RuntimeException) {
            return RespuestasApi::error(401, 'unauthenticated', 'No autenticado.');
        }

        if (! in_array($rol, $rolesPermitidos, true)) {
            return RespuestasApi::error(403, 'forbidden', 'Sin permiso para esta acción.');
        }

        return null;
    }

    public function after(RequestInterface $request, ResponseInterface $response, $arguments = null)
    {
        return null;
    }
}
