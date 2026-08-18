<?php
use Config\Paths;
define('FCPATH', __DIR__ . DIRECTORY_SEPARATOR);
$_SERVER['SCRIPT_NAME'] = '/index.php';
require FCPATH . '../warhorse_app/app/Config/Paths.php';
$paths = new Paths();
require $paths->systemDirectory . '/Boot.php';

header('Content-Type: text/html; charset=utf-8');

try {
    echo "Connecting to DB...<br>";
    $db = \Config\Database::connect();
    echo "Running listar on UnidadModel...<br>";
    $listado = (new \App\Models\UnidadModel())->listar(null, 1, 100);
    echo "Success! Total: " . $listado['total'] . "<br>";
    echo "<pre>";
    print_r($listado['data']);
    echo "</pre>";
} catch (\Throwable $e) {
    echo "<h3>Error: " . htmlspecialchars($e->getMessage()) . "</h3>";
    echo "<pre>" . htmlspecialchars($e->getTraceAsString()) . "</pre>";
}
