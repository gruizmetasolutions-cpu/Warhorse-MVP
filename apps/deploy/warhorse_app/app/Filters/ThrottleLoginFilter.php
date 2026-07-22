<?php

declare(strict_types=1);

namespace App\Filters;

use App\Libraries\RespuestasApi;
use CodeIgniter\Filters\FilterInterface;
use CodeIgniter\HTTP\IncomingRequest;
use CodeIgniter\HTTP\RequestInterface;
use CodeIgniter\HTTP\ResponseInterface;

/**
 * Throttling del login (doc 04 §A07 / doc 05 §1.5): 5 intentos por minuto
 * por combinación IP+email. El 6º recibe 429.
 */
class ThrottleLoginFilter implements FilterInterface
{
    public function before(RequestInterface $request, $arguments = null)
    {
        if (service('throttler')->check(self::llaveDe($request), 5, MINUTE) === false) {
            return RespuestasApi::error(429, 'rate_limited', 'Demasiados intentos; espera un minuto.');
        }

        return null;
    }

    public function after(RequestInterface $request, ResponseInterface $response, $arguments = null)
    {
        return null;
    }

    public static function llaveDe(RequestInterface $request): string
    {
        $email = '';
        if ($request instanceof IncomingRequest) {
            $valor = $request->getJsonVar('email');
            $email = is_string($valor) ? strtolower(trim($valor)) : '';
        }

        return 'login-' . md5($request->getIPAddress() . $email);
    }
}
