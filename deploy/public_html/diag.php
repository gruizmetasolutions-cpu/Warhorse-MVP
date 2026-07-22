<?php
/**
 * Diagnostic endpoint – upload to public_html/diag.php
 * Call: https://warhorse.dataholics.com.mx/diag.php
 * DELETE after debugging.
 */
header('Content-Type: application/json; charset=utf-8');

$info = [];

// 1. PHP version
$info['php_version'] = PHP_VERSION;

// 2. Key $_SERVER variables CI4 uses for routing
$info['REQUEST_URI']    = $_SERVER['REQUEST_URI']    ?? '(not set)';
$info['QUERY_STRING']   = $_SERVER['QUERY_STRING']   ?? '(not set)';
$info['PATH_INFO']      = $_SERVER['PATH_INFO']      ?? '(not set)';
$info['SCRIPT_NAME']    = $_SERVER['SCRIPT_NAME']    ?? '(not set)';
$info['DOCUMENT_ROOT']  = $_SERVER['DOCUMENT_ROOT']  ?? '(not set)';
$info['SCRIPT_FILENAME']= $_SERVER['SCRIPT_FILENAME']?? '(not set)';

// 3. Check that ../warhorse_app exists and key files are readable
$paths_file = __DIR__ . '/../warhorse_app/app/Config/Paths.php';
$env_file   = __DIR__ . '/../warhorse_app/.env';
$routes_file= __DIR__ . '/../warhorse_app/app/Config/Routes.php';
$system_dir = __DIR__ . '/../warhorse_app/vendor/codeigniter4/framework/system';

$info['paths_file_exists']   = file_exists($paths_file);
$info['env_file_exists']     = file_exists($env_file);
$info['routes_file_exists']  = file_exists($routes_file);
$info['system_dir_exists']   = is_dir($system_dir);

// 4. Read .env key settings
if (file_exists($env_file)) {
    $env_content = file_get_contents($env_file);
    preg_match('/app\.baseURL\s*=\s*(.*)/', $env_content, $m);
    $info['env_baseURL'] = trim($m[1] ?? '(not found)');
    preg_match('/app\.indexPage\s*=\s*(.*)/', $env_content, $m);
    $info['env_indexPage'] = trim($m[1] ?? '(not found)');
    preg_match('/app\.uriProtocol\s*=\s*(.*)/', $env_content, $m);
    $info['env_uriProtocol'] = trim($m[1] ?? '(not found)');
    preg_match('/CI_ENVIRONMENT\s*=\s*(.*)/', $env_content, $m);
    $info['env_CI_ENVIRONMENT'] = trim($m[1] ?? '(not found)');
}

// 5. List files in warhorse_app/app/Config/
$config_dir = __DIR__ . '/../warhorse_app/app/Config/';
if (is_dir($config_dir)) {
    $info['config_files'] = array_values(array_diff(scandir($config_dir), ['.', '..']));
}

// 6. List files in warhorse_app/app/Controllers/Api/V1/
$ctrl_dir = __DIR__ . '/../warhorse_app/app/Controllers/Api/V1/';
if (is_dir($ctrl_dir)) {
    $info['api_v1_controllers'] = array_values(array_diff(scandir($ctrl_dir), ['.', '..']));
}

// 7. Try to read first few lines of Routes.php
if (file_exists($routes_file)) {
    $info['routes_first_30_lines'] = array_slice(file($routes_file, FILE_IGNORE_NEW_LINES), 0, 30);
}

// 8. Check Boot.php exists
$boot_file = $system_dir . '/Boot.php';
$info['boot_file_exists'] = file_exists($boot_file);

// 9. FCPATH simulation
$info['__DIR__'] = __DIR__;
$info['realpath_warhorse_app'] = realpath(__DIR__ . '/../warhorse_app') ?: '(cannot resolve)';

echo json_encode($info, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
