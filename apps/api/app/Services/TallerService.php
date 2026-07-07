<?php

declare(strict_types=1);

namespace App\Services;

use App\Exceptions\ConflictoException;
use App\Exceptions\NoEncontradoException;
use App\Exceptions\ValidacionException;
use App\Libraries\Bd;
use App\Models\RegistroTallerModel;
use App\Models\UnidadModel;

/**
 * Módulo Taller (RF-TAL-01..04): ingreso con detección de reincidencia,
 * liberación Total/Parcial con transacción ACID, alerta de deuda técnica
 * y marca de candidata a reincidencia.
 */
final class TallerService
{
    public function __construct(
        private readonly RegistroTallerModel $registros = new RegistroTallerModel(),
        private readonly UnidadModel $unidades = new UnidadModel(),
        private readonly ConsolidadoService $consolidado = new ConsolidadoService(),
        private readonly AuditoriaService $auditoria = new AuditoriaService(),
    ) {
    }

    /**
     * @param array<string, mixed> $datos
     * @param array<string, mixed> $actor
     *
     * @return array<string, mixed>
     */
    public function registrarIngreso(array $datos, array $actor): array
    {
        $unidad = $this->unidades->porId((int) ($datos['unidad_id'] ?? 0));
        if ($unidad === null) {
            // RF-INT-01: sin transacciones huérfanas
            throw new ValidacionException('La unidad no existe en el catálogo.', [
                'unidad_id' => ['La unidad no existe en el catálogo.'],
            ]);
        }

        // RF-TAL-04: reingreso por la MISMA falla tras un mejoralito
        $diagnostico    = trim((string) $datos['diagnostico']);
        $esReincidencia = false;
        if ((bool) $unidad['candidata_reincidencia']) {
            $previo = Bd::fila(
                db_connect()->table('registros_taller')
                    ->where('unidad_id', (int) $unidad['id'])
                    ->where('tipo_liberacion', 'Parcial')
                    ->where('LOWER(diagnostico)', mb_strtolower($diagnostico)),
            );
            $esReincidencia = $previo !== null;
        }

        $this->registros->insert([
            'unidad_id'       => (int) $unidad['id'],
            'fecha_ingreso'   => $datos['fecha_ingreso'],
            'diagnostico'     => $diagnostico,
            'criticidad'      => $datos['criticidad'],
            'costo_taller'    => 0,
            'es_reincidencia' => $esReincidencia ? 1 : 0,
            'registrado_por'  => (int) $actor['id'],
        ]);
        $id = (int) $this->registros->getInsertID();

        $fila = $this->registros->porId($id);

        return $fila ?? [];
    }

    /**
     * @param array<string, mixed> $datos
     * @param array<string, mixed> $actor
     *
     * @return array<string, mixed>
     */
    public function liberar(int $id, array $datos, array $actor): array
    {
        $registro = $this->registros->porId($id);
        if ($registro === null) {
            throw new NoEncontradoException('Registro de taller no encontrado.');
        }

        // §2.9: desde Liberado (cualquiera), toda liberación posterior es ilegal
        if ($registro['tipo_liberacion'] !== null) {
            throw new ConflictoException('La unidad ya fue liberada de este ingreso.');
        }

        $tipo  = (string) ($datos['tipo_liberacion'] ?? '');
        $costo = (float) ($datos['costo_taller'] ?? 0);

        $pendientes = null;
        if ($tipo === 'Parcial') {
            $lista = array_values(array_filter(
                array_map(static fn ($p): string => trim((string) $p), (array) ($datos['pendientes'] ?? [])),
                static fn (string $p): bool => $p !== '',
            ));
            if ($lista === []) {
                throw new ValidacionException('Una liberación parcial exige al menos un pendiente.', [
                    'pendientes' => ['Una liberación parcial exige al menos un pendiente.'],
                ]);
            }
            $pendientes = json_encode($lista, JSON_UNESCAPED_UNICODE);
        }

        $db = db_connect();
        $db->transStart();

        $this->registros->update($id, [
            'tipo_liberacion' => $tipo,
            'fecha_salida'    => $datos['fecha_salida'],
            'costo_taller'    => $costo,
            'pendientes'      => $pendientes,
        ]);

        // RF-TAL-02: el costo de taller suma al consolidado de la unidad
        $this->consolidado->agregarTaller((int) $registro['unidad_id'], $costo);

        if ($tipo === 'Parcial') {
            // RF-TAL-04: alerta de deuda técnica + candidata a reincidencia
            $db->table('alertas_deuda_tecnica')->insert([
                'unidad_id'          => (int) $registro['unidad_id'],
                'registro_taller_id' => $id,
                'pendientes'         => $pendientes,
            ]);
            $this->unidades->update((int) $registro['unidad_id'], ['candidata_reincidencia' => 1]);
            $this->auditoria->registrar($actor, 'taller.liberacion_parcial', 'registros_taller', $id, [
                'tipo_liberacion' => null,
            ], [
                'tipo_liberacion' => 'Parcial',
                'pendientes'      => json_decode((string) $pendientes, true),
                'costo_taller'    => $costo,
            ]);
        } else {
            $this->auditoria->registrar($actor, 'taller.liberada', 'registros_taller', $id, [
                'tipo_liberacion' => null,
            ], [
                'tipo_liberacion' => 'Total',
                'costo_taller'    => $costo,
            ]);
        }

        $db->transComplete();

        $fila = $this->registros->porId($id);

        return $fila ?? [];
    }

    /**
     * Listado con unidad y días en taller derivados (para la pantalla Taller).
     *
     * @return list<array<string, mixed>>
     */
    public function listar(): array
    {
        $filas = Bd::filas(
            db_connect()->table('registros_taller t')
                ->select('t.*, u.id_unidad')
                ->join('unidades u', 'u.id = t.unidad_id')
                ->orderBy('t.fecha_ingreso', 'DESC')
                ->orderBy('t.id', 'DESC'),
        );

        return array_map(static function (array $t): array {
            $t['dias_en_taller'] = $t['fecha_salida'] === null
                ? null
                : (int) ((strtotime((string) $t['fecha_salida']) - strtotime((string) $t['fecha_ingreso'])) / 86400);
            $t['pendientes'] = $t['pendientes'] === null ? null : json_decode((string) $t['pendientes'], true);

            return $t;
        }, $filas);
    }
}
