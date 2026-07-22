<?php

declare(strict_types=1);

namespace App\Filters;

use CodeIgniter\Filters\FilterInterface;
use CodeIgniter\HTTP\RequestInterface;
use CodeIgniter\HTTP\ResponseInterface;

/**
 * Cabeceras de seguridad (doc 04 §A05 / checklist §4.2). En producción el
 * borde (Nginx) también las emite; aquí se aseguran a nivel de aplicación
 * para toda respuesta de la API, incluidas las de error de los filtros.
 *
 * La API solo devuelve JSON: una CSP `default-src 'none'` es suficiente y
 * evita que cualquier respuesta se interprete como documento activo.
 */
class CabecerasSeguridad implements FilterInterface
{
    public function before(RequestInterface $request, $arguments = null)
    {
        return null;
    }

    public function after(RequestInterface $request, ResponseInterface $response, $arguments = null)
    {
        $response->setHeader('X-Content-Type-Options', 'nosniff');
        $response->setHeader('X-Frame-Options', 'DENY');
        $response->setHeader('Referrer-Policy', 'no-referrer');
        $response->setHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'");

        return $response;
    }
}
