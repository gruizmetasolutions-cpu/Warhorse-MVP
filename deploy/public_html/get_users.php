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
    // Shield stores users in `users`, emails in `auth_identities` (type='email_password') or `users.username`.
    // And roles in `auth_groups_users`.
    $users = $db->table('users')->select('id, username')->get()->getResultArray();
    $roles = $db->table('auth_groups_users')->get()->getResultArray();
    $identities = $db->table('auth_identities')->where('type', 'email_password')->get()->getResultArray();
    
    echo "<h1>System Users</h1>";
    echo "<table border='1'><tr><th>ID</th><th>Username</th><th>Email</th><th>Role</th></tr>";
    
    foreach ($users as $u) {
        $email = '';
        foreach ($identities as $i) {
            if ($i['user_id'] == $u['id']) {
                $email = $i['secret'];
                break;
            }
        }
        $role = '';
        foreach ($roles as $r) {
            if ($r['user_id'] == $u['id']) {
                $role = $r['group'];
                break;
            }
        }
        
        echo "<tr><td>{$u['id']}</td><td>{$u['username']}</td><td>{$email}</td><td>{$role}</td></tr>";
    }
    echo "</table>";
} catch (\Throwable $e) {
    echo "<h2>Failed!</h2>";
    echo "<pre>" . $e->getMessage() . "\n" . $e->getTraceAsString() . "</pre>";
}
