<?php

declare(strict_types=1);

namespace App\Services;

use App\Libraries\Bd;
use CodeIgniter\I18n\Time;

/**
 * Dashboard de Dirección (RF-DASH-01..06): KPIs y ranking en O(1) desde
 * consolidado_unidad (sin N+1) y veredicto Mantener/Evaluar/Vender calculado
 * SIEMPRE server-side con el umbral/ventana vigentes de parametros_veredicto.
 *
 * El costo del veredicto es el Costo Real Acumulado del consolidado (contrato
 * doc 05 §8); la ventana acota la evidencia operativa de la unidad: qué
 * liberaciones ponderan el % mejoralito y qué cargas alimentan la eficiencia.
 */
final class DashboardService
{
    public function __construct(
        private readonly ParametrosService $parametros = new ParametrosService(),
    ) {
    }

    /**
     * @return array<string, mixed>
     */
    public function armar(?string $seleccion): array
    {
        $parametros = $this->parametros->obtener();

        // RF-DASH-01: agregado O(1) sobre el consolidado de tractores activos
        $kpis = Bd::fila(
            db_connect()->table('consolidado_unidad c')
                ->select('COALESCE(SUM(c.total_diesel),0) diesel, COALESCE(SUM(c.total_refacciones),0) refacciones, COALESCE(SUM(c.total_taller),0) taller, COALESCE(SUM(c.costo_real_acumulado),0) costo_real_acumulado')
                ->join('unidades u', 'u.id = c.unidad_id')
                ->where('u.estado', 'Activo')
                ->where('u.tipo', 'Tractor'),
        ) ?? ['diesel' => 0, 'refacciones' => 0, 'taller' => 0, 'costo_real_acumulado' => 0];

        $filas = Bd::filas(
            db_connect()->table('consolidado_unidad c')
                ->select('u.id, u.id_unidad, u.valor_referencia, c.costo_real_acumulado costo_total')
                ->join('unidades u', 'u.id = c.unidad_id')
                ->where('u.estado', 'Activo')
                ->where('u.tipo', 'Tractor')
                ->orderBy('c.costo_real_acumulado', 'DESC')
                ->orderBy('u.id_unidad', 'ASC'),
        );

        $ranking = [];
        foreach ($filas as $i => $f) {
            $ranking[] = [
                'id'          => (int) $f['id'],
                'id_unidad'   => (string) $f['id_unidad'],
                'costo_total' => (float) $f['costo_total'],
                'critico'     => $i === 0,
            ];
        }

        $elegida = null;
        if ($seleccion !== null) {
            $candidata = array_values(array_filter($filas, static fn (array $f): bool => (string) $f['id_unidad'] === $seleccion));
            $elegida   = $candidata[0] ?? null;
        }
        $elegida ??= $filas[0] ?? null;

        return [
            'kpis' => [
                'diesel'               => (float) $kpis['diesel'],
                'refacciones'          => (float) $kpis['refacciones'],
                'taller'               => (float) $kpis['taller'],
                'costo_real_acumulado' => (float) $kpis['costo_real_acumulado'],
            ],
            'ranking'    => $ranking,
            'seleccion'  => $elegida === null ? null : $this->analizarUnidad($elegida, $parametros),
            'parametros' => [
                'umbral_pct'    => $parametros['umbral_pct'],
                'ventana_meses' => $parametros['ventana_meses'],
            ],
        ];
    }

    /**
     * @param array<string, mixed>                                    $unidad
     * @param array{id: int, umbral_pct: int, ventana_meses: int}     $parametros
     *
     * @return array<string, mixed>
     */
    private function analizarUnidad(array $unidad, array $parametros): array
    {
        $unidadId = (int) $unidad['id'];
        $desde    = Time::now()->subMonths($parametros['ventana_meses'])->toDateString();

        // RF-DASH-02: eficiencia km/L desde cargas reales dentro de la ventana
        $carga = Bd::fila(
            db_connect()->table('registros_diesel')
                ->select('COALESCE(SUM(km_recorridos),0) km, COALESCE(SUM(litros),0) litros')
                ->where('unidad_id', $unidadId)
                ->where('fecha >=', $desde),
        );
        $litros     = (float) ($carga['litros'] ?? 0);
        $eficiencia = $litros > 0 ? round(((float) ($carga['km'] ?? 0)) / $litros, 1) : null;

        // RF-DASH-03: % Total vs. mejoralito de las liberaciones en la ventana
        $liberaciones = Bd::fila(
            db_connect()->table('registros_taller')
                ->select("COUNT(*) liberadas, COALESCE(SUM(tipo_liberacion = 'Total'),0) totales")
                ->where('unidad_id', $unidadId)
                ->where('tipo_liberacion IS NOT NULL')
                ->where('fecha_salida >=', $desde),
        );
        $liberadas     = (int) ($liberaciones['liberadas'] ?? 0);
        $pctTotal      = $liberadas > 0 ? (int) round(((int) ($liberaciones['totales'] ?? 0)) / $liberadas * 100) : 100;
        $pctMejoralito = 100 - $pctTotal;

        $costo = (float) $unidad['costo_total'];
        $valor = $unidad['valor_referencia'] === null ? null : (float) $unidad['valor_referencia'];

        [$veredicto, $razon] = $this->veredicto($costo, $valor, $pctMejoralito, $parametros['umbral_pct']);

        return [
            'id'                        => $unidadId,
            'id_unidad'                 => (string) $unidad['id_unidad'],
            'costo_total'               => $costo,
            'valor_referencia'          => $valor,
            'eficiencia_km_l'           => $eficiencia,
            'pct_reparacion_total'      => $pctTotal,
            'pct_mejoralito'            => $pctMejoralito,
            'veredicto'                 => $veredicto,
            'razon'                     => $razon,
            'valor_referencia_pendiente' => $valor === null,
        ];
    }

    /**
     * RF-DASH-04: la regla del veredicto, con la razón textual del demo.
     *
     * @return array{0: string|null, 1: string}
     */
    private function veredicto(float $costo, ?float $valor, int $pctMejoralito, int $umbral): array
    {
        if ($valor === null) {
            return [null, 'Valor de referencia pendiente: captura el valor estimado de la unidad para calcular su veredicto.'];
        }

        $pct = (int) round($costo / $valor * 100);

        if ($pct < $umbral) {
            return ['Mantener', sprintf(
                'El costo acumulado (%s) representa el %d%% del valor estimado (%s), debajo del umbral del %d%%. La unidad sigue siendo un activo rentable.',
                $this->pesos($costo),
                $pct,
                $this->pesos($valor),
                $umbral,
            )];
        }

        if ($pctMejoralito > 0) {
            return ['Vender', sprintf(
                'El costo acumulado (%s) ya representa el %d%% del valor estimado del tracto (%s), por encima del umbral del %d%%. Además, %d%% de sus liberaciones fueron "mejoralito": reincide.',
                $this->pesos($costo),
                $pct,
                $this->pesos($valor),
                $umbral,
                $pctMejoralito,
            )];
        }

        return ['Evaluar', sprintf(
            'El costo acumulado (%s) ya representa el %d%% del valor estimado del tracto (%s), por encima del umbral del %d%%. Sin mejoralitos en la ventana: evaluar la unidad caso a caso.',
            $this->pesos($costo),
            $pct,
            $this->pesos($valor),
            $umbral,
        )];
    }

    private function pesos(float $monto): string
    {
        return '$' . number_format(round($monto), 0, '.', ',');
    }
}
