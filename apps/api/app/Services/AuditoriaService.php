<?php

declare(strict_types=1);

namespace App\Services;

use App\Libraries\Bd;

/**
 * Bitácora de eventos críticos (RF-INT-05). Se escribe DENTRO de la misma
 * transacción del cambio que audita (doc 02 §3.10) y Dirección la consulta
 * con filtros (doc 05 §9).
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

    /**
     * @param array{entidad?: string|null, entidad_id?: int|null, actor_id?: int|null, accion?: string|null, desde?: string|null, hasta?: string|null} $filtros
     *
     * @return array{data: list<array<string, mixed>>, total: int}
     */
    public function listar(array $filtros, int $pagina, int $porPagina): array
    {
        $filtrado = static function () use ($filtros) {
            $builder = db_connect()->table('auditoria a');
            if (! empty($filtros['entidad'])) {
                $builder->where('a.entidad', $filtros['entidad']);
            }
            if (! empty($filtros['entidad_id'])) {
                $builder->where('a.entidad_id', (int) $filtros['entidad_id']);
            }
            if (! empty($filtros['actor_id'])) {
                $builder->where('a.actor_id', (int) $filtros['actor_id']);
            }
            if (! empty($filtros['accion'])) {
                $builder->where('a.accion', $filtros['accion']);
            }
            if (! empty($filtros['desde'])) {
                $builder->where('a.creado_en >=', $filtros['desde'] . ' 00:00:00');
            }
            if (! empty($filtros['hasta'])) {
                $builder->where('a.creado_en <=', $filtros['hasta'] . ' 23:59:59');
            }

            return $builder;
        };

        $total = (int) $filtrado()->countAllResults();

        $filas = Bd::filas(
            $filtrado()
                ->select('a.*, u.nombre AS actor')
                ->join('usuarios u', 'u.id = a.actor_id')
                ->orderBy('a.id', 'DESC')
                ->limit($porPagina, ($pagina - 1) * $porPagina),
        );

        $data = array_map(static fn (array $f): array => [
            'id'             => (int) $f['id'],
            'actor_id'       => (int) $f['actor_id'],
            'actor'          => (string) $f['actor'],
            'accion'         => (string) $f['accion'],
            'entidad'        => (string) $f['entidad'],
            'entidad_id'     => (int) $f['entidad_id'],
            'valor_anterior' => $f['valor_anterior'] === null ? null : json_decode((string) $f['valor_anterior'], true),
            'valor_nuevo'    => $f['valor_nuevo'] === null ? null : json_decode((string) $f['valor_nuevo'], true),
            'creado_en'      => (string) $f['creado_en'],
        ], $filas);

        return ['data' => $data, 'total' => $total];
    }
}
