<?php

declare(strict_types=1);

namespace App\Services;

/**
 * Bitácora de eventos críticos (RF-INT-05). Se escribe DENTRO de la misma
 * transacción del cambio que audita (doc 02 §3.10).
 */
final class AuditoriaService
{
    /**
     * @param array<string, mixed>      $actor
     * @param array<string, mixed>|null $anterior
     * @param array<string, mixed>|null $nuevo
     */
    public function registrar(
        array $actor,
        string $accion,
        string $entidad,
        int $entidadId,
        ?array $anterior,
        ?array $nuevo,
    ): void {
        db_connect()->table('auditoria')->insert([
            'actor_id'       => (int) $actor['id'],
            'accion'         => $accion,
            'entidad'        => $entidad,
            'entidad_id'     => $entidadId,
            'valor_anterior' => $anterior === null ? null : json_encode($anterior, JSON_UNESCAPED_UNICODE),
            'valor_nuevo'    => $nuevo === null ? null : json_encode($nuevo, JSON_UNESCAPED_UNICODE),
        ]);
    }
}
