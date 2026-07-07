<?php

declare(strict_types=1);

namespace App\Jobs;

use CodeIgniter\Queue\BaseJob;
use CodeIgniter\Queue\Interfaces\JobInterface;

/**
 * Notificación asíncrona a Compras cuando entra una requisición (RF-REQ-06).
 * En el MVP el canal es correo; en desarrollo se registra en el log. El job
 * es idempotente: reintentarlo solo re-emite el aviso.
 */
final class NotificarCompras extends BaseJob implements JobInterface
{
    public function process(): bool
    {
        $requisicionId = (int) ($this->data['requisicion_id'] ?? 0);
        $pieza         = (string) ($this->data['descripcion_pieza'] ?? '');
        $urgencia      = (string) ($this->data['urgencia'] ?? '');

        log_message('info', "[NotificarCompras] Requisición #{$requisicionId} ({$pieza}, urgencia {$urgencia}) lista en el panel de Compras.");

        return true;
    }
}
