<?php return \CodeIgniter\PHPStan\Database\Schema\Schema::__set_state(array(
   'hash' => '344aa0a9fc316e07f98ff4234d2109608b063f76953a1dee11ab0889cd10e010',
   'tables' => 
  array (
    'users' => 
    \CodeIgniter\PHPStan\Database\Schema\Table::__set_state(array(
       'name' => 'users',
       'columns' => 
      array (
        'id' => 
        \CodeIgniter\PHPStan\Database\Schema\Column::__set_state(array(
           'name' => 'id',
           'type' => 'INTEGER',
           'nullable' => true,
           'primaryKey' => true,
           'default' => NULL,
        )),
        'username' => 
        \CodeIgniter\PHPStan\Database\Schema\Column::__set_state(array(
           'name' => 'username',
           'type' => 'varchar',
           'nullable' => true,
           'primaryKey' => false,
           'default' => NULL,
        )),
        'status' => 
        \CodeIgniter\PHPStan\Database\Schema\Column::__set_state(array(
           'name' => 'status',
           'type' => 'varchar',
           'nullable' => true,
           'primaryKey' => false,
           'default' => NULL,
        )),
        'status_message' => 
        \CodeIgniter\PHPStan\Database\Schema\Column::__set_state(array(
           'name' => 'status_message',
           'type' => 'varchar',
           'nullable' => true,
           'primaryKey' => false,
           'default' => NULL,
        )),
        'active' => 
        \CodeIgniter\PHPStan\Database\Schema\Column::__set_state(array(
           'name' => 'active',
           'type' => 'tinyint',
           'nullable' => false,
           'primaryKey' => false,
           'default' => '0',
        )),
        'last_active' => 
        \CodeIgniter\PHPStan\Database\Schema\Column::__set_state(array(
           'name' => 'last_active',
           'type' => 'datetime',
           'nullable' => true,
           'primaryKey' => false,
           'default' => NULL,
        )),
        'created_at' => 
        \CodeIgniter\PHPStan\Database\Schema\Column::__set_state(array(
           'name' => 'created_at',
           'type' => 'datetime',
           'nullable' => true,
           'primaryKey' => false,
           'default' => NULL,
        )),
        'updated_at' => 
        \CodeIgniter\PHPStan\Database\Schema\Column::__set_state(array(
           'name' => 'updated_at',
           'type' => 'datetime',
           'nullable' => true,
           'primaryKey' => false,
           'default' => NULL,
        )),
        'deleted_at' => 
        \CodeIgniter\PHPStan\Database\Schema\Column::__set_state(array(
           'name' => 'deleted_at',
           'type' => 'datetime',
           'nullable' => true,
           'primaryKey' => false,
           'default' => NULL,
        )),
      ),
    )),
    'auth_identities' => 
    \CodeIgniter\PHPStan\Database\Schema\Table::__set_state(array(
       'name' => 'auth_identities',
       'columns' => 
      array (
        'id' => 
        \CodeIgniter\PHPStan\Database\Schema\Column::__set_state(array(
           'name' => 'id',
           'type' => 'INTEGER',
           'nullable' => true,
           'primaryKey' => true,
           'default' => NULL,
        )),
        'user_id' => 
        \CodeIgniter\PHPStan\Database\Schema\Column::__set_state(array(
           'name' => 'user_id',
           'type' => 'INT',
           'nullable' => false,
           'primaryKey' => false,
           'default' => NULL,
        )),
        'type' => 
        \CodeIgniter\PHPStan\Database\Schema\Column::__set_state(array(
           'name' => 'type',
           'type' => 'varchar',
           'nullable' => false,
           'primaryKey' => false,
           'default' => NULL,
        )),
        'name' => 
        \CodeIgniter\PHPStan\Database\Schema\Column::__set_state(array(
           'name' => 'name',
           'type' => 'varchar',
           'nullable' => true,
           'primaryKey' => false,
           'default' => NULL,
        )),
        'secret' => 
        \CodeIgniter\PHPStan\Database\Schema\Column::__set_state(array(
           'name' => 'secret',
           'type' => 'varchar',
           'nullable' => false,
           'primaryKey' => false,
           'default' => NULL,
        )),
        'secret2' => 
        \CodeIgniter\PHPStan\Database\Schema\Column::__set_state(array(
           'name' => 'secret2',
           'type' => 'varchar',
           'nullable' => true,
           'primaryKey' => false,
           'default' => NULL,
        )),
        'expires' => 
        \CodeIgniter\PHPStan\Database\Schema\Column::__set_state(array(
           'name' => 'expires',
           'type' => 'datetime',
           'nullable' => true,
           'primaryKey' => false,
           'default' => NULL,
        )),
        'extra' => 
        \CodeIgniter\PHPStan\Database\Schema\Column::__set_state(array(
           'name' => 'extra',
           'type' => 'TEXT',
           'nullable' => true,
           'primaryKey' => false,
           'default' => NULL,
        )),
        'force_reset' => 
        \CodeIgniter\PHPStan\Database\Schema\Column::__set_state(array(
           'name' => 'force_reset',
           'type' => 'tinyint',
           'nullable' => false,
           'primaryKey' => false,
           'default' => '0',
        )),
        'last_used_at' => 
        \CodeIgniter\PHPStan\Database\Schema\Column::__set_state(array(
           'name' => 'last_used_at',
           'type' => 'datetime',
           'nullable' => true,
           'primaryKey' => false,
           'default' => NULL,
        )),
        'created_at' => 
        \CodeIgniter\PHPStan\Database\Schema\Column::__set_state(array(
           'name' => 'created_at',
           'type' => 'datetime',
           'nullable' => true,
           'primaryKey' => false,
           'default' => NULL,
        )),
        'updated_at' => 
        \CodeIgniter\PHPStan\Database\Schema\Column::__set_state(array(
           'name' => 'updated_at',
           'type' => 'datetime',
           'nullable' => true,
           'primaryKey' => false,
           'default' => NULL,
        )),
      ),
    )),
    'auth_logins' => 
    \CodeIgniter\PHPStan\Database\Schema\Table::__set_state(array(
       'name' => 'auth_logins',
       'columns' => 
      array (
        'id' => 
        \CodeIgniter\PHPStan\Database\Schema\Column::__set_state(array(
           'name' => 'id',
           'type' => 'INTEGER',
           'nullable' => true,
           'primaryKey' => true,
           'default' => NULL,
        )),
        'ip_address' => 
        \CodeIgniter\PHPStan\Database\Schema\Column::__set_state(array(
           'name' => 'ip_address',
           'type' => 'varchar',
           'nullable' => false,
           'primaryKey' => false,
           'default' => NULL,
        )),
        'user_agent' => 
        \CodeIgniter\PHPStan\Database\Schema\Column::__set_state(array(
           'name' => 'user_agent',
           'type' => 'varchar',
           'nullable' => true,
           'primaryKey' => false,
           'default' => NULL,
        )),
        'id_type' => 
        \CodeIgniter\PHPStan\Database\Schema\Column::__set_state(array(
           'name' => 'id_type',
           'type' => 'varchar',
           'nullable' => false,
           'primaryKey' => false,
           'default' => NULL,
        )),
        'identifier' => 
        \CodeIgniter\PHPStan\Database\Schema\Column::__set_state(array(
           'name' => 'identifier',
           'type' => 'varchar',
           'nullable' => false,
           'primaryKey' => false,
           'default' => NULL,
        )),
        'user_id' => 
        \CodeIgniter\PHPStan\Database\Schema\Column::__set_state(array(
           'name' => 'user_id',
           'type' => 'INT',
           'nullable' => true,
           'primaryKey' => false,
           'default' => NULL,
        )),
        'date' => 
        \CodeIgniter\PHPStan\Database\Schema\Column::__set_state(array(
           'name' => 'date',
           'type' => 'datetime',
           'nullable' => false,
           'primaryKey' => false,
           'default' => NULL,
        )),
        'success' => 
        \CodeIgniter\PHPStan\Database\Schema\Column::__set_state(array(
           'name' => 'success',
           'type' => 'tinyint',
           'nullable' => false,
           'primaryKey' => false,
           'default' => NULL,
        )),
      ),
    )),
    'auth_token_logins' => 
    \CodeIgniter\PHPStan\Database\Schema\Table::__set_state(array(
       'name' => 'auth_token_logins',
       'columns' => 
      array (
        'id' => 
        \CodeIgniter\PHPStan\Database\Schema\Column::__set_state(array(
           'name' => 'id',
           'type' => 'INTEGER',
           'nullable' => true,
           'primaryKey' => true,
           'default' => NULL,
        )),
        'ip_address' => 
        \CodeIgniter\PHPStan\Database\Schema\Column::__set_state(array(
           'name' => 'ip_address',
           'type' => 'varchar',
           'nullable' => false,
           'primaryKey' => false,
           'default' => NULL,
        )),
        'user_agent' => 
        \CodeIgniter\PHPStan\Database\Schema\Column::__set_state(array(
           'name' => 'user_agent',
           'type' => 'varchar',
           'nullable' => true,
           'primaryKey' => false,
           'default' => NULL,
        )),
        'id_type' => 
        \CodeIgniter\PHPStan\Database\Schema\Column::__set_state(array(
           'name' => 'id_type',
           'type' => 'varchar',
           'nullable' => false,
           'primaryKey' => false,
           'default' => NULL,
        )),
        'identifier' => 
        \CodeIgniter\PHPStan\Database\Schema\Column::__set_state(array(
           'name' => 'identifier',
           'type' => 'varchar',
           'nullable' => false,
           'primaryKey' => false,
           'default' => NULL,
        )),
        'user_id' => 
        \CodeIgniter\PHPStan\Database\Schema\Column::__set_state(array(
           'name' => 'user_id',
           'type' => 'INT',
           'nullable' => true,
           'primaryKey' => false,
           'default' => NULL,
        )),
        'date' => 
        \CodeIgniter\PHPStan\Database\Schema\Column::__set_state(array(
           'name' => 'date',
           'type' => 'datetime',
           'nullable' => false,
           'primaryKey' => false,
           'default' => NULL,
        )),
        'success' => 
        \CodeIgniter\PHPStan\Database\Schema\Column::__set_state(array(
           'name' => 'success',
           'type' => 'tinyint',
           'nullable' => false,
           'primaryKey' => false,
           'default' => NULL,
        )),
      ),
    )),
    'auth_remember_tokens' => 
    \CodeIgniter\PHPStan\Database\Schema\Table::__set_state(array(
       'name' => 'auth_remember_tokens',
       'columns' => 
      array (
        'id' => 
        \CodeIgniter\PHPStan\Database\Schema\Column::__set_state(array(
           'name' => 'id',
           'type' => 'INTEGER',
           'nullable' => true,
           'primaryKey' => true,
           'default' => NULL,
        )),
        'selector' => 
        \CodeIgniter\PHPStan\Database\Schema\Column::__set_state(array(
           'name' => 'selector',
           'type' => 'varchar',
           'nullable' => false,
           'primaryKey' => false,
           'default' => NULL,
        )),
        'hashedValidator' => 
        \CodeIgniter\PHPStan\Database\Schema\Column::__set_state(array(
           'name' => 'hashedValidator',
           'type' => 'varchar',
           'nullable' => false,
           'primaryKey' => false,
           'default' => NULL,
        )),
        'user_id' => 
        \CodeIgniter\PHPStan\Database\Schema\Column::__set_state(array(
           'name' => 'user_id',
           'type' => 'INT',
           'nullable' => false,
           'primaryKey' => false,
           'default' => NULL,
        )),
        'expires' => 
        \CodeIgniter\PHPStan\Database\Schema\Column::__set_state(array(
           'name' => 'expires',
           'type' => 'datetime',
           'nullable' => false,
           'primaryKey' => false,
           'default' => NULL,
        )),
        'created_at' => 
        \CodeIgniter\PHPStan\Database\Schema\Column::__set_state(array(
           'name' => 'created_at',
           'type' => 'datetime',
           'nullable' => false,
           'primaryKey' => false,
           'default' => NULL,
        )),
        'updated_at' => 
        \CodeIgniter\PHPStan\Database\Schema\Column::__set_state(array(
           'name' => 'updated_at',
           'type' => 'datetime',
           'nullable' => false,
           'primaryKey' => false,
           'default' => NULL,
        )),
      ),
    )),
    'auth_groups_users' => 
    \CodeIgniter\PHPStan\Database\Schema\Table::__set_state(array(
       'name' => 'auth_groups_users',
       'columns' => 
      array (
        'id' => 
        \CodeIgniter\PHPStan\Database\Schema\Column::__set_state(array(
           'name' => 'id',
           'type' => 'INTEGER',
           'nullable' => true,
           'primaryKey' => true,
           'default' => NULL,
        )),
        'user_id' => 
        \CodeIgniter\PHPStan\Database\Schema\Column::__set_state(array(
           'name' => 'user_id',
           'type' => 'INT',
           'nullable' => false,
           'primaryKey' => false,
           'default' => NULL,
        )),
        'group' => 
        \CodeIgniter\PHPStan\Database\Schema\Column::__set_state(array(
           'name' => 'group',
           'type' => 'varchar',
           'nullable' => false,
           'primaryKey' => false,
           'default' => NULL,
        )),
        'created_at' => 
        \CodeIgniter\PHPStan\Database\Schema\Column::__set_state(array(
           'name' => 'created_at',
           'type' => 'datetime',
           'nullable' => false,
           'primaryKey' => false,
           'default' => NULL,
        )),
      ),
    )),
    'auth_permissions_users' => 
    \CodeIgniter\PHPStan\Database\Schema\Table::__set_state(array(
       'name' => 'auth_permissions_users',
       'columns' => 
      array (
        'id' => 
        \CodeIgniter\PHPStan\Database\Schema\Column::__set_state(array(
           'name' => 'id',
           'type' => 'INTEGER',
           'nullable' => true,
           'primaryKey' => true,
           'default' => NULL,
        )),
        'user_id' => 
        \CodeIgniter\PHPStan\Database\Schema\Column::__set_state(array(
           'name' => 'user_id',
           'type' => 'INT',
           'nullable' => false,
           'primaryKey' => false,
           'default' => NULL,
        )),
        'permission' => 
        \CodeIgniter\PHPStan\Database\Schema\Column::__set_state(array(
           'name' => 'permission',
           'type' => 'varchar',
           'nullable' => false,
           'primaryKey' => false,
           'default' => NULL,
        )),
        'created_at' => 
        \CodeIgniter\PHPStan\Database\Schema\Column::__set_state(array(
           'name' => 'created_at',
           'type' => 'datetime',
           'nullable' => false,
           'primaryKey' => false,
           'default' => NULL,
        )),
      ),
    )),
    'settings' => 
    \CodeIgniter\PHPStan\Database\Schema\Table::__set_state(array(
       'name' => 'settings',
       'columns' => 
      array (
        'id' => 
        \CodeIgniter\PHPStan\Database\Schema\Column::__set_state(array(
           'name' => 'id',
           'type' => 'INTEGER',
           'nullable' => true,
           'primaryKey' => true,
           'default' => NULL,
        )),
        'class' => 
        \CodeIgniter\PHPStan\Database\Schema\Column::__set_state(array(
           'name' => 'class',
           'type' => 'varchar',
           'nullable' => false,
           'primaryKey' => false,
           'default' => NULL,
        )),
        'key' => 
        \CodeIgniter\PHPStan\Database\Schema\Column::__set_state(array(
           'name' => 'key',
           'type' => 'varchar',
           'nullable' => false,
           'primaryKey' => false,
           'default' => NULL,
        )),
        'value' => 
        \CodeIgniter\PHPStan\Database\Schema\Column::__set_state(array(
           'name' => 'value',
           'type' => 'TEXT',
           'nullable' => true,
           'primaryKey' => false,
           'default' => NULL,
        )),
        'type' => 
        \CodeIgniter\PHPStan\Database\Schema\Column::__set_state(array(
           'name' => 'type',
           'type' => 'varchar',
           'nullable' => false,
           'primaryKey' => false,
           'default' => '\'string\'',
        )),
        'created_at' => 
        \CodeIgniter\PHPStan\Database\Schema\Column::__set_state(array(
           'name' => 'created_at',
           'type' => 'datetime',
           'nullable' => false,
           'primaryKey' => false,
           'default' => NULL,
        )),
        'updated_at' => 
        \CodeIgniter\PHPStan\Database\Schema\Column::__set_state(array(
           'name' => 'updated_at',
           'type' => 'datetime',
           'nullable' => false,
           'primaryKey' => false,
           'default' => NULL,
        )),
        'context' => 
        \CodeIgniter\PHPStan\Database\Schema\Column::__set_state(array(
           'name' => 'context',
           'type' => 'varchar',
           'nullable' => true,
           'primaryKey' => false,
           'default' => NULL,
        )),
      ),
    )),
    'queue_jobs' => 
    \CodeIgniter\PHPStan\Database\Schema\Table::__set_state(array(
       'name' => 'queue_jobs',
       'columns' => 
      array (
        'id' => 
        \CodeIgniter\PHPStan\Database\Schema\Column::__set_state(array(
           'name' => 'id',
           'type' => 'INTEGER',
           'nullable' => true,
           'primaryKey' => true,
           'default' => NULL,
        )),
        'queue' => 
        \CodeIgniter\PHPStan\Database\Schema\Column::__set_state(array(
           'name' => 'queue',
           'type' => 'varchar',
           'nullable' => false,
           'primaryKey' => false,
           'default' => NULL,
        )),
        'payload' => 
        \CodeIgniter\PHPStan\Database\Schema\Column::__set_state(array(
           'name' => 'payload',
           'type' => 'TEXT',
           'nullable' => false,
           'primaryKey' => false,
           'default' => NULL,
        )),
        'status' => 
        \CodeIgniter\PHPStan\Database\Schema\Column::__set_state(array(
           'name' => 'status',
           'type' => 'tinyint',
           'nullable' => false,
           'primaryKey' => false,
           'default' => '0',
        )),
        'attempts' => 
        \CodeIgniter\PHPStan\Database\Schema\Column::__set_state(array(
           'name' => 'attempts',
           'type' => 'tinyint',
           'nullable' => false,
           'primaryKey' => false,
           'default' => '0',
        )),
        'available_at' => 
        \CodeIgniter\PHPStan\Database\Schema\Column::__set_state(array(
           'name' => 'available_at',
           'type' => 'INT',
           'nullable' => false,
           'primaryKey' => false,
           'default' => NULL,
        )),
        'created_at' => 
        \CodeIgniter\PHPStan\Database\Schema\Column::__set_state(array(
           'name' => 'created_at',
           'type' => 'INT',
           'nullable' => false,
           'primaryKey' => false,
           'default' => NULL,
        )),
        'priority' => 
        \CodeIgniter\PHPStan\Database\Schema\Column::__set_state(array(
           'name' => 'priority',
           'type' => 'varchar',
           'nullable' => false,
           'primaryKey' => false,
           'default' => '\'default\'',
        )),
      ),
    )),
    'queue_jobs_failed' => 
    \CodeIgniter\PHPStan\Database\Schema\Table::__set_state(array(
       'name' => 'queue_jobs_failed',
       'columns' => 
      array (
        'id' => 
        \CodeIgniter\PHPStan\Database\Schema\Column::__set_state(array(
           'name' => 'id',
           'type' => 'INTEGER',
           'nullable' => true,
           'primaryKey' => true,
           'default' => NULL,
        )),
        'connection' => 
        \CodeIgniter\PHPStan\Database\Schema\Column::__set_state(array(
           'name' => 'connection',
           'type' => 'varchar',
           'nullable' => false,
           'primaryKey' => false,
           'default' => NULL,
        )),
        'queue' => 
        \CodeIgniter\PHPStan\Database\Schema\Column::__set_state(array(
           'name' => 'queue',
           'type' => 'varchar',
           'nullable' => false,
           'primaryKey' => false,
           'default' => NULL,
        )),
        'payload' => 
        \CodeIgniter\PHPStan\Database\Schema\Column::__set_state(array(
           'name' => 'payload',
           'type' => 'TEXT',
           'nullable' => false,
           'primaryKey' => false,
           'default' => NULL,
        )),
        'exception' => 
        \CodeIgniter\PHPStan\Database\Schema\Column::__set_state(array(
           'name' => 'exception',
           'type' => 'TEXT',
           'nullable' => false,
           'primaryKey' => false,
           'default' => NULL,
        )),
        'failed_at' => 
        \CodeIgniter\PHPStan\Database\Schema\Column::__set_state(array(
           'name' => 'failed_at',
           'type' => 'INT',
           'nullable' => false,
           'primaryKey' => false,
           'default' => NULL,
        )),
        'priority' => 
        \CodeIgniter\PHPStan\Database\Schema\Column::__set_state(array(
           'name' => 'priority',
           'type' => 'varchar',
           'nullable' => false,
           'primaryKey' => false,
           'default' => '\'default\'',
        )),
      ),
    )),
  ),
));
