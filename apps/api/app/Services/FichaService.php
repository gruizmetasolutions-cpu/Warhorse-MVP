<?php

declare(strict_types=1);

namespace App\Services;

use App\Exceptions\NoEncontradoException;
use App\Libraries\Bd;
use App\Models\UnidadModel;

/**
 * Ficha de tracto (RF-FIC-01..04, doc 05 §3): encabezado, KPIs del
 * consolidado, reparaciones, piezas instaladas y — si es Yonke — donaciones.
 */
final class FichaService
{
    public function __construct(
        private readonly UnidadModel $unidades = new UnidadModel(),
        private readonly ConsolidadoService $consolidado = new ConsolidadoService(),
    ) {
    }

    /**
     * @return array<string, mixed>
     */
    public function armar(int $unidadId): array
    {
        $unidad = $this->unidades->porId($unidadId);
        if ($unidad === null) {
            throw new NoEncontradoException('Unidad no encontrada.');
        }

        $db      = db_connect();
        $esYonke = $unidad['estado'] === 'Yonke';

        $reparaciones = [];
        if (! $esYonke) {
            $filas = Bd::filas(
                $db->table('registros_taller')->where('unidad_id', $unidadId)->orderBy('fecha_ingreso', 'ASC'),
            );

            foreach ($filas as $r) {
                $dias = $r['fecha_salida'] === null
                    ? null
                    : (int) ((strtotime((string) $r['fecha_salida']) - strtotime((string) $r['fecha_ingreso'])) / 86400);
                $reparaciones[] = [
                    'fecha_ingreso'   => (string) $r['fecha_ingreso'],
                    'fecha_salida'    => $r['fecha_salida'],
                    'dias_en_taller'  => $dias,
                    'diagnostico'     => (string) $r['diagnostico'],
                    'criticidad'      => (string) $r['criticidad'],
                    'tipo_liberacion' => $r['tipo_liberacion'],
                    'costo_taller'    => (float) $r['costo_taller'],
                    'es_reincidencia' => (bool) $r['es_reincidencia'],
                ];
            }
        }

        $piezasInstaladas = [];
        if (! $esYonke) {
            $filas = Bd::filas(
                $db->table('requisiciones r')
                    ->select('r.*, d.id_unidad AS donante_id_unidad')
                    ->join('unidades d', 'd.id = r.unidad_donante_id', 'left')
                    ->where('r.unidad_destino_id', $unidadId)
                    ->orderBy('r.fecha_solicitud', 'ASC'),
            );

            foreach ($filas as $q) {
                $esEstimado         = $q['origen'] === 'Yonke';
                $piezasInstaladas[] = [
                    'descripcion_pieza' => (string) $q['descripcion_pieza'],
                    'origen'            => (string) $q['origen'],
                    'unidad_donante_id' => $q['donante_id_unidad'],
                    'costo'             => $esEstimado
                        ? ($q['costo_estimado'] === null ? null : (float) $q['costo_estimado'])
                        : ($q['costo_real'] === null ? null : (float) $q['costo_real']),
                    'es_estimado' => $esEstimado,
                    'estado'      => (string) $q['estado'],
                    'fecha'       => $q['fecha_instalacion'] ?? $q['fecha_solicitud'],
                ];
            }
        }

        $piezasDonadas = [];
        if ($esYonke) {
            $filas = Bd::filas(
                $db->table('requisiciones r')
                    ->select('r.descripcion_pieza, r.costo_estimado, r.fecha_instalacion, r.fecha_solicitud, dest.id_unidad AS destino_id_unidad')
                    ->join('unidades dest', 'dest.id = r.unidad_destino_id')
                    ->where('r.unidad_donante_id', $unidadId)
                    ->where('r.estado', 'Instalado')
                    ->orderBy('r.fecha_solicitud', 'ASC'),
            );

            foreach ($filas as $q) {
                $piezasDonadas[] = [
                    'descripcion_pieza' => (string) $q['descripcion_pieza'],
                    'unidad_destino'    => (string) $q['destino_id_unidad'],
                    'costo_estimado'    => (float) $q['costo_estimado'],
                    'fecha'             => $q['fecha_instalacion'] ?? $q['fecha_solicitud'],
                ];
            }
        }

        return [
            'unidad' => [
                'id'                     => (int) $unidad['id'],
                'id_unidad'              => (string) $unidad['id_unidad'],
                'tipo'                   => (string) $unidad['tipo'],
                'estado'                 => (string) $unidad['estado'],
                'valor_referencia'       => $unidad['valor_referencia'] === null ? null : (float) $unidad['valor_referencia'],
                'candidata_reincidencia' => (bool) $unidad['candidata_reincidencia'],
            ],
            'kpis'              => $this->consolidado->deUnidad($unidadId),
            'reparaciones'      => $reparaciones,
            'piezas_instaladas' => $piezasInstaladas,
            'piezas_donadas'    => $piezasDonadas,
        ];
    }
}
