<?php
// Temporary script to execute database migrations on shared hosting
// Set environment explicitly
$_SERVER['CI_ENVIRONMENT'] = 'production';

define("FCPATH", __DIR__ . DIRECTORY_SEPARATOR);
if (getcwd() . DIRECTORY_SEPARATOR !== FCPATH) {
    chdir(FCPATH);
}
// Note: run_migrations.php is uploaded to the root of the domain (public_html/run_migrations.php).
// The warhorse_app folder is at FCPATH . 'warhorse_app/' or FCPATH . '../warhorse_app/'.
// Let's look at index.php: it does require FCPATH . '../warhorse_app/app/Config/Paths.php'.
// Because FCPATH is __DIR__, in public_html, FCPATH . '../warhorse_app/app/Config/Paths.php' points to the sibling folder.
// Since we upload run_migrations.php to public_html/ (the web root), the path is indeed FCPATH . '../warhorse_app/app/Config/Paths.php'.

if (file_exists(FCPATH . 'warhorse_app/app/Config/Paths.php')) {
    require FCPATH . 'warhorse_app/app/Config/Paths.php';
} else {
    require FCPATH . '../warhorse_app/app/Config/Paths.php';
}
$paths = new Config\Paths();
require $paths->systemDirectory . "/Boot.php";

class Bootstrapper extends \CodeIgniter\Boot {
    public static function init($paths) {
        static::definePathConstants($paths);
        static::loadConstants();
        static::loadDotEnv($paths);
        static::defineEnvironment();
        static::loadEnvironmentBootstrap($paths);
        static::loadCommonFunctions();
        static::loadAutoloader();
        static::setExceptionHandler();
        static::autoloadHelpers();
        static::initializeCodeIgniter();
    }
}
Bootstrapper::init($paths);

try {
    // Run migrations using CI4 runner CLI emulator or services directly
    $migrate = \CodeIgniter\Config\Services::migrations();
    
    // CodeIgniter 4 lets us run migrate:latest via Runner
    // Let's migrate all namespaces: App, Shield, Settings, Queue
    $namespaces = ["CodeIgniter\Settings", "CodeIgniter\Shield", "CodeIgniter\Queue", "App"];
    
    echo "<h1>Starting migrations...</h1>";
    foreach ($namespaces as $ns) {
        echo "Migrating namespace: {$ns}<br>";
        $migrate->setNamespace($ns);
        $migrate->latest();
    }
    
    echo "<h2>Migration completed successfully!</h2>";
} catch (\Throwable $e) {
    echo "<h2>Migration failed!</h2>";
    echo "<pre>" . $e->getMessage() . "\n" . $e->getTraceAsString() . "</pre>";
}
