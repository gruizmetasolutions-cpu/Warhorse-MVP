<?php

declare(strict_types=1);

namespace App\Jobs;

use CodeIgniter\Queue\BaseJob;
use CodeIgniter\Queue\Interfaces\JobInterface;

/**
 * Correo con credenciales temporales al dar de alta un usuario (RF-USR-01).
 * En el MVP el canal es correo; en desarrollo se registra en el log sin
 * exponer la contraseña.
 */
final class CorreoCredenciales extends BaseJob implements JobInterface
{
    public function process(): bool
    {
        $email  = (string) ($this->data['email'] ?? '');
        $nombre = (string) ($this->data['nombre'] ?? '');

        log_message('info', "[CorreoCredenciales] Credenciales temporales enviadas a {$nombre} <{$email}>.");

        return true;
    }
}
