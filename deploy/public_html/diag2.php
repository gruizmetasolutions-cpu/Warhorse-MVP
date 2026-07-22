<?php
/**
 * Diagnostic: What does CI4 see?
 * Upload to public_html/diag2.php
 * Call: https://warhorse.dataholics.com.mx/diag2.php
 * DELETE after debugging.
 */
header('Content-Type: application/json; charset=utf-8');

$info = [];

// 1. SERVER variables
$info['REQUEST_URI']     = $_SERVER['REQUEST_URI']     ?? '(not set)';
$info['QUERY_STRING']    = $_SERVER['QUERY_STRING']    ?? '(not set)';
$info['PATH_INFO']       = $_SERVER['PATH_INFO']       ?? '(not set)';
$info['SCRIPT_NAME']     = $_SERVER['SCRIPT_NAME']     ?? '(not set)';
$info['SCRIPT_FILENAME'] = $_SERVER['SCRIPT_FILENAME'] ?? '(not set)';
$info['DOCUMENT_ROOT']   = $_SERVER['DOCUMENT_ROOT']   ?? '(not set)';
$info['REQUEST_METHOD']  = $_SERVER['REQUEST_METHOD']  ?? '(not set)';
$info['SERVER_SOFTWARE'] = $_SERVER['SERVER_SOFTWARE']  ?? '(not set)';
$info['REDIRECT_URL']    = $_SERVER['REDIRECT_URL']    ?? '(not set)';
$info['REDIRECT_STATUS'] = $_SERVER['REDIRECT_STATUS'] ?? '(not set)';

// 2. Check key directories
$info['cwd'] = getcwd();
$info['__DIR__'] = __DIR__;
$info['fcpath'] = __DIR__ . DIRECTORY_SEPARATOR;

// 3. Check if ../warhorse_app structure is valid
$base = __DIR__ . '/../warhorse_app';
$info['warhorse_app_realpath'] = realpath($base) ?: '(cannot resolve)';
$info['paths_php_exists']  = file_exists($base . '/app/Config/Paths.php');
$info['boot_php_exists']   = file_exists($base . '/vendor/codeigniter4/framework/system/Boot.php');
$info['env_exists']        = file_exists($base . '/.env');
$info['routes_exists']     = file_exists($base . '/app/Config/Routes.php');

// 4. Try to boot CI4 and capture what it detects
try {
    define('FCPATH', __DIR__ . DIRECTORY_SEPARATOR);
    if (getcwd() . DIRECTORY_SEPARATOR !== FCPATH) {
        chdir(FCPATH);
    }
    
    require FCPATH . '../warhorse_app/app/Config/Paths.php';
    $paths = new \Config\Paths();
    
    $info['paths_systemDir']   = $paths->systemDirectory;
    $info['paths_appDir']      = $paths->appDirectory;
    $info['paths_writableDir'] = $paths->writableDirectory;
    $info['paths_envDir']      = $paths->envDirectory;
    
    $info['systemDir_realpath']  = realpath($paths->systemDirectory) ?: '(cannot resolve)';
    $info['appDir_realpath']     = realpath($paths->appDirectory) ?: '(cannot resolve)';
    $info['writableDir_realpath'] = realpath($paths->writableDirectory) ?: '(cannot resolve)';
    $info['envDir_realpath']     = realpath($paths->envDirectory) ?: '(cannot resolve)';
    
    $info['ci4_boot'] = 'Paths loaded successfully';
    
} catch (\Throwable $e) {
    $info['ci4_boot_error'] = $e->getMessage();
    $info['ci4_boot_file']  = $e->getFile();
    $info['ci4_boot_line']  = $e->getLine();
}

echo json_encode($info, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
