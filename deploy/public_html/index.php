<?php

use CodeIgniter\Boot;
use Config\Paths;

/*
 * Front controller de producción para hosting compartido (Hostinger).
 *
 * El código de la aplicación (app/, vendor/, writable/, .env) vive FUERA del
 * webroot, en ~/warhorse_app/ (hermano de public_html). Este archivo es lo
 * único de CI4 que se expone públicamente, junto con el SPA.
 */

$minPhpVersion = '8.2';
if (version_compare(PHP_VERSION, $minPhpVersion, '<')) {
    header('HTTP/1.1 503 Service Unavailable.', true, 503);
    echo sprintf('Tu versión de PHP debe ser %s o superior. Actual: %s', $minPhpVersion, PHP_VERSION);

    exit(1);
}

// Ruta a este front controller
define('FCPATH', __DIR__ . DIRECTORY_SEPARATOR);

if (getcwd() . DIRECTORY_SEPARATOR !== FCPATH) {
    chdir(FCPATH);
}

// La aplicación está un nivel arriba del webroot: ~/warhorse_app/
// (public_html/index.php  ->  ../warhorse_app/app/Config/Paths.php)
require FCPATH . '../warhorse_app/app/Config/Paths.php';

$paths = new Paths();

require $paths->systemDirectory . '/Boot.php';

exit(Boot::bootWeb($paths));
