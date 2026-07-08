<?php

declare(strict_types=1);

namespace App\Filters;

use App\Libraries\ActorActual;
use App\Libraries\RespuestasApi;
use CodeIgniter\Filters\FilterInterface;
use CodeIgniter\HTTP\RequestInterface;
use CodeIgniter\HTTP\ResponseInterface;

/**
 * Rate limit de endpoints mutantes (doc 04 §3.1 / §A04): 60 mutaciones por
 * minuto por actor autenticado. Corre DESPUÉS de api-auth, así que el actor
 * ya está resuelto; si no lo estuviera, cae al IP como bucket.
 */
class ThrottleMutacionesFilter implements FilterInterface
{
    public function before(RequestInterface $request, $arguments = null)
    {
        $actorId = 0;
        try {
            $actorId = (int) ActorActual::usuario()['id'];
        } catch (\RuntimeException) {
            // sin actor todavía: usa la IP
        }
        $bucket = $actorId > 0 ? 'mut-actor-' . $actorId : 'mut-ip-' . md5($request->getIPAddress());

        if (service('throttler')->check($bucket, 60, MINUTE) === false) {
            return RespuestasApi::error(429, 'rate_limited', 'Demasiadas operaciones; espera un momento.');
        }

        return null;
    }

    public function after(RequestInterface $request, ResponseInterface $response, $arguments = null)
    {
        return null;
    }
}
