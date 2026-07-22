<?php

declare(strict_types=1);

namespace App\Database\Seeds;

use CodeIgniter\Database\Seeder;

/**
 * Datos de desarrollo: la flota y transacciones del demo validado (doc 09 §5.1
 * / mockData del standalone) mapeadas a la nomenclatura del doc 03 §3:
 * valor_estimado→valor_referencia, tracto_*_id→unidad_*_id (FKs numéricas).
 */
class DatosDemoSeeder extends Seeder
{
    /**
     * @return list<array<string, mixed>>
     */
    private function filas(string $tabla): array
    {
        $resultado = $this->db->table($tabla)->get();
        if (! $resultado instanceof \CodeIgniter\Database\ResultInterface) {
            throw new \RuntimeException("No se pudo leer la tabla {$tabla}.");
        }

        /** @var list<array<string, mixed>> */
        return array_values($resultado->getResultArray());
    }

    public function run(): void
    {
        // ---- unidades (valor 0 del demo = valor_referencia pendiente → NULL) ----
        // insertBatch exige llaves uniformes en todas las filas
        $unidades = [
            ['id_unidad' => 'WH101', 'tipo' => 'Tractor', 'estado' => 'Activo', 'fecha_alta' => '2021-03-15', 'valor_referencia' => 480000.00, 'candidata_reincidencia' => 0],
            ['id_unidad' => 'WH104', 'tipo' => 'Tractor', 'estado' => 'Activo', 'fecha_alta' => '2021-08-02', 'valor_referencia' => 520000.00, 'candidata_reincidencia' => 0],
            ['id_unidad' => 'WH118', 'tipo' => 'Tractor', 'estado' => 'Activo', 'fecha_alta' => '2019-11-20', 'valor_referencia' => 350000.00, 'candidata_reincidencia' => 0],
            ['id_unidad' => 'WH125', 'tipo' => 'Tractor', 'estado' => 'Activo', 'fecha_alta' => '2017-06-10', 'valor_referencia' => 210000.00, 'candidata_reincidencia' => 1],
            ['id_unidad' => 'WH210', 'tipo' => 'Tractor', 'estado' => 'Activo', 'fecha_alta' => '2023-01-25', 'valor_referencia' => 610000.00, 'candidata_reincidencia' => 0],
            ['id_unidad' => 'WH03', 'tipo' => 'Tractor', 'estado' => 'Yonke', 'fecha_alta' => '2012-04-01', 'valor_referencia' => null, 'candidata_reincidencia' => 0],
            ['id_unidad' => 'WH60', 'tipo' => 'Tractor', 'estado' => 'Yonke', 'fecha_alta' => '2014-09-18', 'valor_referencia' => null, 'candidata_reincidencia' => 0],
            ['id_unidad' => 'CJ12', 'tipo' => 'Caja', 'estado' => 'Activo', 'fecha_alta' => '2020-02-12', 'valor_referencia' => 180000.00, 'candidata_reincidencia' => 0],
            ['id_unidad' => 'CJ07', 'tipo' => 'Caja', 'estado' => 'Inactivo', 'fecha_alta' => '2015-07-30', 'valor_referencia' => 90000.00, 'candidata_reincidencia' => 0],
        ];
        $this->db->table('unidades')->insertBatch($unidades);

        $uid = [];
        foreach ($this->filas('unidades') as $u) {
            $uid[(string) $u['id_unidad']] = (int) $u['id'];
        }

        $usuario = [];
        foreach ($this->filas('usuarios') as $u) {
            $usuario[(string) $u['rol']] ??= (int) $u['id'];
        }

        $pieza = [];
        foreach ($this->filas('catalogo_piezas') as $p) {
            $pieza[(string) $p['nombre_normalizado']] = (int) $p['id'];
        }

        // ---- consolidado (totales del demo: diésel / refacciones / taller) ----
        $consolidado = [
            'WH101' => [25000, 12000, 8000],
            'WH104' => [31000, 9500, 6200],
            'WH118' => [22400, 15800, 11400],
            'WH125' => [18000, 43500, 32000],
            'WH210' => [28500, 4200, 3100],
            'WH03'  => [0, 0, 0],
            'WH60'  => [0, 0, 0],
            'CJ12'  => [0, 2100, 1400],
            'CJ07'  => [0, 0, 0],
        ];
        foreach ($consolidado as $idUnidad => [$diesel, $refacciones, $taller]) {
            $this->db->table('consolidado_unidad')->insert([
                'unidad_id'         => $uid[$idUnidad],
                'total_diesel'      => $diesel,
                'total_refacciones' => $refacciones,
                'total_taller'      => $taller,
            ]);
        }

        // ---- reparaciones (registros_taller; criticidad y liberación del demo;
        //      'Mejoralito' del demo = tipo_liberacion 'Parcial' con pendientes) ----
        $reps = [
            ['WH125', '2026-03-01', '2026-05-26', 'Transmisión tronada', 'Crítico', 'Total', 32000, null, 0],
            ['WH125', '2026-06-02', '2026-06-14', 'Pasa aceite al turbo', 'Crítico', 'Parcial', 8500, ['Cambio de sellos definitivo'], 0],
            ['WH125', '2026-06-24', '2026-06-27', 'Ajuste de frenos', 'Media', 'Parcial', 2400, ['Rectificar discos'], 1],
            ['WH101', '2026-05-12', '2026-05-12', 'Cambio de focos', 'Rápida', 'Total', 350, null, 0],
            ['WH101', '2026-06-08', '2026-06-11', 'Cambio de válvulas', 'Media', 'Total', 5200, null, 0],
            ['WH104', '2026-06-15', '2026-06-16', 'Ajuste de frenos', 'Media', 'Total', 1900, null, 0],
            ['WH104', '2026-06-26', '2026-06-26', 'Wiper dañado', 'Rápida', 'Parcial', 600, ['Reemplazo de brazo completo'], 0],
            ['WH118', '2026-06-09', '2026-06-09', 'Chapa rota', 'Rápida', 'Parcial', 450, ['Chapa nueva pendiente de pieza'], 0],
            ['WH118', '2026-06-17', '2026-06-22', 'Suspensión trasera', 'Media', 'Total', 7800, null, 0],
            ['WH210', '2026-06-29', '2026-06-29', 'Preventivo general', 'Rápida', 'Total', 1200, null, 0],
        ];
        foreach ($reps as [$idUnidad, $ingreso, $salida, $diag, $crit, $lib, $costo, $pend, $reinc]) {
            $this->db->table('registros_taller')->insert([
                'unidad_id'       => $uid[$idUnidad],
                'fecha_ingreso'   => $ingreso,
                'fecha_salida'    => $salida,
                'diagnostico'     => $diag,
                'criticidad'      => $crit,
                'costo_taller'    => $costo,
                'tipo_liberacion' => $lib,
                'pendientes'      => $pend === null ? null : json_encode($pend, JSON_UNESCAPED_UNICODE),
                'es_reincidencia' => $reinc,
                'registrado_por'  => $usuario['taller'],
            ]);
        }

        // ---- requisiciones (las 8 del demo) ----
        $reqs = [
            ['destino' => 'WH101', 'origen' => 'Yonke', 'donante' => 'WH03', 'desc' => 'Turbo', 'estimado' => 4500.00, 'origen_costo' => 'catalogo', 'urgencia' => 'Crítica', 'estado' => 'Instalado', 'solicitud' => '2026-06-20', 'instalacion' => '2026-06-22'],
            ['destino' => 'WH104', 'origen' => 'Compra', 'donante' => null, 'desc' => 'Balatas de freno', 'estimado' => null, 'origen_costo' => null, 'urgencia' => 'Media', 'estado' => 'Cotizado', 'solicitud' => '2026-06-28', 'instalacion' => null],
            ['destino' => 'WH125', 'origen' => 'Yonke', 'donante' => 'WH60', 'desc' => 'Caja de transmisión', 'estimado' => 28000.00, 'origen_costo' => 'catalogo', 'urgencia' => 'Crítica', 'estado' => 'Instalado', 'solicitud' => '2026-03-10', 'instalacion' => '2026-05-20'],
            ['destino' => 'WH125', 'origen' => 'Compra', 'donante' => null, 'desc' => 'Kit de clutch', 'estimado' => null, 'origen_costo' => null, 'urgencia' => 'Crítica', 'estado' => 'Comprado', 'solicitud' => '2026-06-25', 'instalacion' => null],
            ['destino' => 'WH118', 'origen' => 'Yonke', 'donante' => 'WH03', 'desc' => 'Chapa de puerta', 'estimado' => 800.00, 'origen_costo' => 'catalogo', 'urgencia' => 'Rápida', 'estado' => 'Instalado', 'solicitud' => '2026-06-10', 'instalacion' => '2026-06-11'],
            ['destino' => 'WH210', 'origen' => 'Compra', 'donante' => null, 'desc' => 'Filtros de aceite', 'estimado' => null, 'origen_costo' => null, 'urgencia' => 'Rápida', 'estado' => 'Solicitado', 'solicitud' => '2026-06-30', 'instalacion' => null],
            ['destino' => 'WH101', 'origen' => 'Compra', 'donante' => null, 'desc' => 'Wiper completo', 'estimado' => null, 'origen_costo' => null, 'urgencia' => 'Media', 'estado' => 'Solicitado', 'solicitud' => '2026-06-29', 'instalacion' => null],
            ['destino' => 'WH104', 'origen' => 'Yonke', 'donante' => 'WH60', 'desc' => 'Alternador', 'estimado' => 3200.00, 'origen_costo' => 'catalogo', 'urgencia' => 'Media', 'estado' => 'Solicitado', 'solicitud' => '2026-06-30', 'instalacion' => null],
        ];
        foreach ($reqs as $i => $r) {
            $fila = [
                'unidad_destino_id'     => $uid[$r['destino']],
                'origen'                => $r['origen'],
                'unidad_donante_id'     => $r['donante'] === null ? null : $uid[$r['donante']],
                'pieza_catalogo_id'     => $pieza[$r['desc']] ?? null,
                'descripcion_pieza'     => $r['desc'],
                'foto_pieza_url'        => sprintf('demo/pieza-%02d.jpg', $i + 1),
                'urgencia'              => $r['urgencia'],
                'costo_estimado'        => $r['estimado'],
                'origen_costo_estimado' => $r['origen_costo'],
                'estado'                => $r['estado'],
                'fecha_solicitud'       => $r['solicitud'],
                'fecha_instalacion'     => $r['instalacion'],
                'creado_por'            => $usuario['taller'],
            ];
            // La ruta Compra ya comprada lleva costo real facturado
            if ($r['origen'] === 'Compra' && in_array($r['estado'], ['Comprado', 'Instalado'], true)) {
                $fila['costo_real']     = 6400.00;
                $fila['numero_factura'] = 'F-10233';
            }
            $this->db->table('requisiciones')->insert($fila);
        }

        // ---- registros de diésel (coherentes con total y eficiencia del demo) ----
        $diesel = [
            // id_unidad => [costo_total_diesel, eficiencia km/L]
            'WH101' => [25000, 2.4],
            'WH104' => [31000, 2.1],
            'WH118' => [22400, 1.8],
            'WH125' => [18000, 1.2],
            'WH210' => [28500, 2.7],
        ];
        $precioLitro = 25.50;
        foreach ($diesel as $idUnidad => [$costoTotal, $kmPorLitro]) {
            // Dos cargas por unidad que suman el total del demo
            foreach ([0.6, 0.4] as $j => $fraccion) {
                $costo  = round($costoTotal * $fraccion, 2);
                $litros = round($costo / $precioLitro, 2);
                $this->db->table('registros_diesel')->insert([
                    'unidad_id'     => $uid[$idUnidad],
                    'fecha'         => $j === 0 ? '2026-06-05' : '2026-06-20',
                    'litros'        => $litros,
                    'costo_total'   => $costo,
                    'km_recorridos' => (int) round($litros * $kmPorLitro),
                    'capturado_por' => $usuario['diesel'],
                ]);
            }
        }
    }
}
