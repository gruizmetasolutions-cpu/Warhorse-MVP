<?php

declare(strict_types=1);

namespace Config;

use App\Jobs\NotificarCompras;
use CodeIgniter\Queue\Config\Queue as BaseQueue;

/**
 * Cola de trabajos (doc 02 §3.9): driver base de datos; jobs idempotentes.
 */
class Queue extends BaseQueue
{
    /**
     * @var array<string, class-string<\CodeIgniter\Queue\Interfaces\JobInterface>>
     */
    public array $jobHandlers = [
        'notificar-compras' => NotificarCompras::class,
    ];
}
