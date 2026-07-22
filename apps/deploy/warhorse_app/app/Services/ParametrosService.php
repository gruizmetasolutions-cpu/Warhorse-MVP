<?php

declare(strict_types=1);

namespace App\Services;

use App\Libraries\Bd;

/**
 * Parámetros del veredicto (RF-DASH-05): umbral (%) y ventana (meses)
 * ajustables en runtime por Dirección; la fila es única y todo cambio
 * queda auditado.
 */
final class ParametrosService
{
    public function __construct(
        private readonly AuditoriaService $auditoria = new AuditoriaService(),
    ) {
    }

    /**
     * @return array{id: int, umbral_pct: int, ventana_meses: int}
     */
    public function obtener(): array
    {
        $fila = Bd::fila(db_connect()->table('parametros_veredicto')->orderBy('id', 'ASC')->limit(1));
        if ($fila === null) {
            throw new \RuntimeException('parametros_veredicto sin sembrar: corre los seeders.');
        }

        return [
            'id'            => (int) $fila['id'],
            'umbral_pct'    => (int) $fila['umbral_pct'],
            'ventana_meses' => (int) $fila['ventana_meses'],
        ];
    }

    /**
     * @param array<string, mixed> $cambio
     * @param array<string, mixed> $actor
     *
     * @return array{umbral_pct: int, ventana_meses: int}
     */
    public function actualizar(array $cambio, array $actor): array
    {
        $actual = $this->obtener();

        $db = db_connect();
        $db->transStart();

        $db->table('parametros_veredicto')->where('id', $actual['id'])->update([
            'umbral_pct'      => (int) $cambio['umbral_pct'],
            'ventana_meses'   => (int) $cambio['ventana_meses'],
            'actualizado_por' => (int) $actor['id'],
        ]);

        $this->auditoria->registrar($actor, 'parametros.veredicto', 'parametros_veredicto', $actual['id'], [
            'umbral_pct'    => $actual['umbral_pct'],
            'ventana_meses' => $actual['ventana_meses'],
        ], [
            'umbral_pct'    => (int) $cambio['umbral_pct'],
            'ventana_meses' => (int) $cambio['ventana_meses'],
        ]);

        $db->transComplete();

        $nuevo = $this->obtener();

        return ['umbral_pct' => $nuevo['umbral_pct'], 'ventana_meses' => $nuevo['ventana_meses']];
    }
}
