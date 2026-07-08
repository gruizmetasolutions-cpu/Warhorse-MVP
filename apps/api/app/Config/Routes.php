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
    $routes->post('unidades', 'UnidadesController::create', ['filter' => ['cors', 'api-auth', 'rbac:admin', 'throttle-mut']]);
    $routes->patch('unidades/(:num)', 'UnidadesController::update/$1', ['filter' => ['cors', 'api-auth', 'rbac:admin', 'throttle-mut']]);

    // Requisiciones (RF-REQ-01..07): crea solo Taller; leen taller (las
    // suyas, anti-IDOR en el service), compras y admin
    $routes->post('requisiciones', 'RequisicionesController::create', ['filter' => ['cors', 'api-auth', 'rbac:taller', 'throttle-mut']]);
    $routes->get('requisiciones', 'RequisicionesController::index', ['filter' => ['cors', 'api-auth', 'rbac:taller,compras,admin']]);
    $routes->get('requisiciones/(:num)/foto', 'RequisicionesController::foto/$1', ['filter' => ['cors', 'api-auth', 'rbac:taller,compras,admin']]);

    // Panel de Compras (RF-COM-01..04): la cola la ven compras y admin; el
    // ciclo lo avanza SOLO compras (doc 05 §6)
    $routes->get('compras/requisiciones', 'ComprasController::index', ['filter' => ['cors', 'api-auth', 'rbac:compras,admin']]);
    $routes->patch('compras/requisiciones/(:num)/estado', 'ComprasController::estado/$1', ['filter' => ['cors', 'api-auth', 'rbac:compras', 'throttle-mut']]);

    // Usuarios y permisos (RF-USR-01/02): solo Dirección
    $routes->get('usuarios', 'UsuariosController::index', ['filter' => ['cors', 'api-auth', 'rbac:admin']]);
    $routes->post('usuarios', 'UsuariosController::create', ['filter' => ['cors', 'api-auth', 'rbac:admin', 'throttle-mut']]);
    $routes->patch('usuarios/(:num)', 'UsuariosController::update/$1', ['filter' => ['cors', 'api-auth', 'rbac:admin', 'throttle-mut']]);

    // Salud de datos (SRS §9): solo Dirección
    $routes->get('metricas/salud', 'MetricasController::salud', ['filter' => ['cors', 'api-auth', 'rbac:admin']]);

    // Bitácora de auditoría (RF-INT-05): solo Dirección
    $routes->get('auditoria', 'AuditoriaController::index', ['filter' => ['cors', 'api-auth', 'rbac:admin']]);

    // Dashboard de Dirección (RF-DASH-01..06): solo admin, veredicto server-side
    $routes->get('dashboard', 'DashboardController::index', ['filter' => ['cors', 'api-auth', 'rbac:admin']]);

    // Parámetros del veredicto (RF-DASH-05): solo Dirección, auditado
    $routes->get('parametros/veredicto', 'ParametrosController::obtener', ['filter' => ['cors', 'api-auth', 'rbac:admin']]);
    $routes->patch('parametros/veredicto', 'ParametrosController::actualizar', ['filter' => ['cors', 'api-auth', 'rbac:admin', 'throttle-mut']]);

    // Diésel (RF-DIE-01..03): captura SOLO el rol diesel (doc 05 §10);
    // lectura diesel y admin
    $routes->get('diesel', 'DieselController::index', ['filter' => ['cors', 'api-auth', 'rbac:diesel,admin']]);
    $routes->post('diesel', 'DieselController::create', ['filter' => ['cors', 'api-auth', 'rbac:diesel', 'throttle-mut']]);

    // Taller (RF-TAL-01..04): captura solo taller; lectura taller y admin
    $routes->get('taller', 'TallerController::index', ['filter' => ['cors', 'api-auth', 'rbac:taller,admin']]);
    $routes->post('taller', 'TallerController::create', ['filter' => ['cors', 'api-auth', 'rbac:taller', 'throttle-mut']]);
    $routes->patch('taller/(:num)/liberar', 'TallerController::liberar/$1', ['filter' => ['cors', 'api-auth', 'rbac:taller', 'throttle-mut']]);
});

// Preflight CORS del SPA
$routes->options('api/(:any)', static fn () => service('response')->setStatusCode(204), ['filter' => 'cors']);
