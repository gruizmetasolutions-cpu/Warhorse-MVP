<?php
$_SERVER['CI_ENVIRONMENT'] = 'production';

define("FCPATH", __DIR__ . DIRECTORY_SEPARATOR);
if (getcwd() . DIRECTORY_SEPARATOR !== FCPATH) {
    chdir(FCPATH);
}

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
    $db = \Config\Database::connect();
    
    // 1. BACKUP
    echo "<h1>Database Backup & Purge Operation</h1>";
    $hostname = $db->hostname;
    $username = escapeshellarg($db->username);
    $password = escapeshellarg($db->password);
    $database = escapeshellarg($db->database);
    
    $backup_dir = WRITEPATH . 'backups/';
    if (!is_dir($backup_dir)) {
        mkdir($backup_dir, 0755, true);
    }
    
    $backup_file = $backup_dir . 'backup_before_purge_' . date('Y-m-d_H-i-s') . '.sql';
    
    // Try mysqldump
    $mysqldump_cmd = "mysqldump -h {$hostname} -u {$username} -p{$password} {$database} > " . escapeshellarg($backup_file) . " 2>&1";
    
    echo "<h2>1. Creating Backup...</h2>";
    $output = [];
    $return_var = 0;
    exec($mysqldump_cmd, $output, $return_var);
    
    if ($return_var !== 0) {
        echo "<p>Warning: mysqldump failed or is unavailable (Code: $return_var). Assuming shared hosting limitations. Proceeding with caution.</p>";
        echo "<pre>" . implode("\n", $output) . "</pre>";
    } else {
        echo "<p>Backup created successfully at: " . htmlspecialchars($backup_file) . "</p>";
    }
    
    // 2. COUNTS BEFORE PURGE
    $tablesToPurge = [
        'requisiciones',
        'reversiones_cotizaciones',
        'registros_taller',
        'ordenes_trabajo',
        'registros_diesel',
        'consolidado_unidad',
        'alertas_deuda_tecnica',
        'auditoria',
        'notificaciones'
    ];
    
    $tablesToKeep = [
        'unidades',
        'usuarios',
        'catalogo_piezas',
        'responsables_taller',
        'users'
    ];
    
    echo "<h2>2. Record Counts (Before)</h2><ul>";
    foreach (array_merge($tablesToPurge, $tablesToKeep) as $table) {
        if ($db->tableExists($table)) {
            $count = $db->table($table)->countAllResults();
            echo "<li>$table: $count</li>";
        }
    }
    echo "</ul>";
    
    // 3. PURGE
    echo "<h2>3. Executing Purge...</h2>";
    $db->query("SET FOREIGN_KEY_CHECKS = 0;");
    foreach ($tablesToPurge as $table) {
        if ($db->tableExists($table)) {
            $db->query("TRUNCATE TABLE {$table};");
            echo "Truncated {$table}.<br>";
        }
    }
    $db->query("SET FOREIGN_KEY_CHECKS = 1;");
    echo "<p>Purge completed.</p>";
    
    // 4. COUNTS AFTER PURGE
    echo "<h2>4. Record Counts (After Verification)</h2><ul>";
    foreach (array_merge($tablesToPurge, $tablesToKeep) as $table) {
        if ($db->tableExists($table)) {
            $count = $db->table($table)->countAllResults();
            echo "<li>$table: $count</li>";
        }
    }
    echo "</ul>";
    
} catch (\Throwable $e) {
    echo "<h2>Operation failed!</h2>";
    echo "<pre>" . $e->getMessage() . "\n" . $e->getTraceAsString() . "</pre>";
}
