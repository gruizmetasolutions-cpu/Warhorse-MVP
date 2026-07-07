<?php

use CodeIgniter\Router\RouteCollection;

/**
 * Rutas de la API v1 (contrato doc 05). Toda ruta bajo api/v1 salvo
 * auth/login exige token (filtro api-auth); las mutantes suman rbac.
 *
 * @var RouteCollection $routes
 */
$routes->get('/', 'Home::index');

$routes->group('api/v1', ['namespace' => 'App\Controllers\Api\V1'], static function (RouteCollection $routes): void {
    // Público (con throttling anti fuerza bruta)
    $routes->post('auth/login', 'AuthController::login', ['filter' => ['cors', 'throttle-login']]);

    // Autenticado
    $routes->post('auth/logout', 'AuthController::logout', ['filter' => ['cors', 'api-auth']]);
    $routes->get('auth/me', 'AuthController::me', ['filter' => ['cors', 'api-auth']]);
});

// Preflight CORS del SPA
$routes->options('api/(:any)', static fn () => service('response')->setStatusCode(204), ['filter' => 'cors']);
