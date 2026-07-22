<?php

declare(strict_types=1);

namespace App\Services;

use App\Libraries\Bd;

/**
 * Métricas de salud de datos (SRS §9): el mayor riesgo del Hub es de
 * adopción; el sistema mide si el piso realmente registra.
 */
final class MetricasService
{
    /**
     * @return array<string, mixed>
     */
    public function salud(): array
    {
        $db = db_connect();

        $reqs = Bd::fila(
            $db->table('requisiciones')->select(
                "COUNT(*) total, COALESCE(SUM(foto_pieza_url IS NOT NULL AND foto_pieza_url <> '' AND origen IS NOT NULL),0) completas",
            ),
        ) ?? ['total' => 0, 'completas' => 0];

        // Base: registros de taller ya cerrados (con fecha de salida)
        $liberaciones = Bd::fila(
            $db->table('registros_taller')->select(
                'COALESCE(SUM(fecha_salida IS NOT NULL),0) total, COALESCE(SUM(fecha_salida IS NOT NULL AND tipo_liberacion IS NOT NULL),0) con_tipo',
            ),
        ) ?? ['total' => 0, 'con_tipo' => 0];

        $yonke = Bd::fila(
            $db->table('requisiciones')->select(
                'COUNT(*) total, COALESCE(SUM(costo_estimado IS NOT NULL AND costo_estimado > 0),0) con_costo',
            )->where('origen', 'Yonke'),
        ) ?? ['total' => 0, 'con_costo' => 0];

        $porOrigen = ['ultima_compra' => 0, 'catalogo' => 0, 'manual' => 0];
        foreach (Bd::filas(
            $db->table('requisiciones')
                ->select('origen_costo_estimado origen_costo, COUNT(*) n')
                ->where('origen', 'Yonke')
                ->where('origen_costo_estimado IS NOT NULL')
                ->groupBy('origen_costo_estimado'),
        ) as $fila) {
            $porOrigen[(string) $fila['origen_costo']] = (int) $fila['n'];
        }

        return [
            'requisiciones' => $this->bloque((int) $reqs['total'], (int) $reqs['completas'], 'con_foto_y_origen'),
            'liberaciones'  => $this->bloque((int) $liberaciones['total'], (int) $liberaciones['con_tipo'], 'con_tipo'),
            'yonke'         => $this->bloque((int) $yonke['total'], (int) $yonke['con_costo'], 'con_costo') + ['por_origen' => $porOrigen],
        ];
    }

    /**
     * @return array<string, int>
     */
    private function bloque(int $total, int $completas, string $campo): array
    {
        return [
            'total' => $total,
            $campo  => $completas,
            'pct'   => $total > 0 ? (int) round($completas / $total * 100) : 100,
        ];
    }
}
