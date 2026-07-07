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

    // Catálogo de unidades (RF-UNI-01..05): lectura para todos los roles,
    // mutaciones solo Dirección (admin)
    $routes->get('unidades', 'UnidadesController::index', ['filter' => ['cors', 'api-auth']]);
    $routes->get('unidades/(:num)/ficha', 'UnidadesController::ficha/$1', ['filter' => ['cors', 'api-auth']]);
    $routes->post('unidades', 'UnidadesController::create', ['filter' => ['cors', 'api-auth', 'rbac:admin']]);
    $routes->patch('unidades/(:num)', 'UnidadesController::update/$1', ['filter' => ['cors', 'api-auth', 'rbac:admin']]);

    // Requisiciones (RF-REQ-01..07): crea solo Taller; leen taller (las
    // suyas, anti-IDOR en el service), compras y admin
    $routes->post('requisiciones', 'RequisicionesController::create', ['filter' => ['cors', 'api-auth', 'rbac:taller']]);
    $routes->get('requisiciones', 'RequisicionesController::index', ['filter' => ['cors', 'api-auth', 'rbac:taller,compras,admin']]);
    $routes->get('requisiciones/(:num)/foto', 'RequisicionesController::foto/$1', ['filter' => ['cors', 'api-auth', 'rbac:taller,compras,admin']]);
});

// Preflight CORS del SPA
$routes->options('api/(:any)', static fn () => service('response')->setStatusCode(204), ['filter' => 'cors']);
