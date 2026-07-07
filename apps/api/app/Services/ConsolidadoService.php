<?php

declare(strict_types=1);

namespace App\Services;

use App\Libraries\Bd;

/**
 * Mantiene el agregado desnormalizado `consolidado_unidad` (doc 03 §5) para
 * lecturas O(1) del Dashboard y la ficha. Se actualiza dentro de la
 * transacción de cada operación de negocio.
 */
final class ConsolidadoService
{
    public function crearFila(int $unidadId): void
    {
        db_connect()->table('consolidado_unidad')->insert(['unidad_id' => $unidadId]);
    }

    /**
     * @return array{diesel: float, refacciones: float, taller: float, costo_real_acumulado: float}
     */
    public function deUnidad(int $unidadId): array
    {
        $fila = Bd::fila(db_connect()->table('consolidado_unidad')->where('unidad_id', $unidadId));

        return [
            'diesel'               => (float) ($fila['total_diesel'] ?? 0),
            'refacciones'          => (float) ($fila['total_refacciones'] ?? 0),
            'taller'               => (float) ($fila['total_taller'] ?? 0),
            'costo_real_acumulado' => (float) ($fila['costo_real_acumulado'] ?? 0),
        ];
    }

    public function agregarDiesel(int $unidadId, float $monto): void
    {
        $this->sumar($unidadId, 'total_diesel', $monto);
    }

    public function agregarRefaccion(int $unidadId, float $monto): void
    {
        $this->sumar($unidadId, 'total_refacciones', $monto);
    }

    public function agregarTaller(int $unidadId, float $monto): void
    {
        $this->sumar($unidadId, 'total_taller', $monto);
    }

    private function sumar(int $unidadId, string $columna, float $monto): void
    {
        db_connect()->table('consolidado_unidad')
            ->where('unidad_id', $unidadId)
            ->set($columna, "{$columna} + " . number_format($monto, 2, '.', ''), false)
            ->update();
    }
}
