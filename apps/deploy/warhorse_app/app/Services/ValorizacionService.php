<?php

declare(strict_types=1);

namespace App\Services;

use App\Libraries\Bd;

/**
 * Valorización de piezas Yonke en cascada (ADR-002): A última compra →
 * C catálogo → manual obligatorio. SIEMPRE > 0; el nivel usado queda en
 * `origen_costo_estimado` (lo asigna el backend, nunca el cliente).
 */
final class ValorizacionService
{
    /**
     * @return array{costo: float, origen: string, pieza_catalogo_id: int|null}|null
     *         null = A y C fallaron (se exige captura manual)
     */
    public function estimar(string $descripcionPieza, ?string $numeroParte): ?array
    {
        $db          = db_connect();
        $descripcion = mb_strtolower(trim($descripcionPieza));

        // Nivel A: última compra registrada de la misma pieza (costo_real facturado)
        $builder = $db->table('requisiciones')
            ->where('costo_real IS NOT NULL', null, false)
            ->groupStart()
            ->where('LOWER(descripcion_pieza)', $descripcion);
        if ($numeroParte !== null && $numeroParte !== '') {
            $builder->orWhere('numero_parte', $numeroParte);
        }
        $ultimaCompra = Bd::fila(
            $builder->groupEnd()->orderBy('fecha_solicitud', 'DESC')->orderBy('id', 'DESC')->limit(1),
        );
        if ($ultimaCompra !== null) {
            return [
                'costo'             => (float) $ultimaCompra['costo_real'],
                'origen'            => 'ultima_compra',
                'pieza_catalogo_id' => $ultimaCompra['pieza_catalogo_id'] === null ? null : (int) $ultimaCompra['pieza_catalogo_id'],
            ];
        }

        // Nivel C: catálogo de piezas con precio de referencia
        $builder = $db->table('catalogo_piezas')
            ->groupStart()
            ->where('LOWER(nombre_normalizado)', $descripcion);
        if ($numeroParte !== null && $numeroParte !== '') {
            $builder->orWhere('numero_parte', $numeroParte);
        }
        $pieza = Bd::fila($builder->groupEnd()->limit(1));
        if ($pieza !== null) {
            return [
                'costo'             => (float) $pieza['precio_referencia'],
                'origen'            => 'catalogo',
                'pieza_catalogo_id' => (int) $pieza['id'],
            ];
        }

        // A y C fallaron → el llamador debe exigir captura manual > 0
        return null;
    }
}
