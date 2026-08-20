<?php

declare(strict_types=1);

namespace App\Services;

use App\Exceptions\ConflictoException;
use App\Exceptions\NoEncontradoException;
use App\Models\UnidadModel;

/**
 * Reglas de negocio del catálogo de unidades: alta (RF-UNI-02), máquina de
 * estados §4.1 SRS (RF-UNI-03) y auditoría de cambios sensibles (RF-INT-05).
 */
final class UnidadService
{
    /**
     * Máquina de estados de Unidad (SRS §4.1). Inactivo es terminal.
     *
     * @var array<string, list<string>>
     */
    private const TRANSICIONES = [
        'Activo'   => ['Yonke', 'Inactivo'],
        'Yonke'    => ['Activo', 'Inactivo'],
        'Inactivo' => [],
    ];

    public function __construct(
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
    public function crear(array $datos, array $actor): array
    {
        if ($this->unidades->where('id_unidad', $datos['id_unidad'])->first() !== null) {
            throw new ConflictoException('Ya existe una unidad con ese ID.');
        }

        $db = db_connect();
        $db->transStart();

        $this->unidades->insert([
            'id_unidad'                 => $datos['id_unidad'],
            'tipo'                      => $datos['tipo'],
            'operacion'                 => $datos['operacion'] ?? null,
            'estado'                    => $datos['estado'] ?? 'Activo',
            'fecha_alta'                => $datos['fecha_alta'],
            'valor_referencia'          => $datos['valor_referencia'] ?? null,
            'vencimiento_documentacion' => $datos['vencimiento_documentacion'] ?? null,
            'vin'                       => $datos['vin'] ?? null,
            'numero_economico'          => $datos['numero_economico'] ?? null,
            'marca'                     => $datos['marca'] ?? null,
            'modelo'                    => $datos['modelo'] ?? null,
            'placas'                    => $datos['placas'] ?? null,
        ]);
        $id = (int) $this->unidades->getInsertID();

        $this->consolidado->crearFila($id);
        $this->auditoria->registrar($actor, 'unidad.alta', 'unidades', $id, null, [
            'id_unidad' => $datos['id_unidad'],
            'estado'    => $datos['estado'] ?? 'Activo',
        ]);

        $db->transComplete();

        return $this->conConsolidado($id);
    }

    /**
     * @param array<string, mixed> $cambio
     * @param array<string, mixed> $actor
     *
     * @return array<string, mixed>
     */
    public function actualizar(int $id, array $cambio, array $actor): array
    {
        $unidad = $this->unidades->porId($id);
        if ($unidad === null) {
            throw new NoEncontradoException('Unidad no encontrada.');
        }

        $db = db_connect();
        $db->transStart();

        if (array_key_exists('estado', $cambio) && $cambio['estado'] !== $unidad['estado']) {
            $legales = self::TRANSICIONES[(string) $unidad['estado']] ?? [];
            if (! in_array($cambio['estado'], $legales, true)) {
                $db->transComplete();

                throw new ConflictoException(
                    "Transición ilegal de estado: {$unidad['estado']} → {$cambio['estado']}.",
                );
            }

            $this->unidades->update($id, ['estado' => $cambio['estado']]);
            $this->auditoria->registrar($actor, 'unidad.estado', 'unidades', $id, [
                'estado' => $unidad['estado'],
            ], [
                'estado' => $cambio['estado'],
            ]);
        }

        if (array_key_exists('valor_referencia', $cambio)
            && (float) $cambio['valor_referencia'] !== (float) ($unidad['valor_referencia'] ?? 0)) {
            $this->unidades->update($id, ['valor_referencia' => $cambio['valor_referencia']]);
            $this->auditoria->registrar($actor, 'unidad.valor_referencia', 'unidades', $id, [
                'valor_referencia' => $unidad['valor_referencia'],
            ], [
                'valor_referencia' => $cambio['valor_referencia'],
            ]);
        }

        if (array_key_exists('vencimiento_documentacion', $cambio)
            && $cambio['vencimiento_documentacion'] !== $unidad['vencimiento_documentacion']) {
            $this->unidades->update($id, ['vencimiento_documentacion' => $cambio['vencimiento_documentacion']]);
            $this->auditoria->registrar($actor, 'unidad.vencimiento_documentacion', 'unidades', $id, [
                'vencimiento_documentacion' => $unidad['vencimiento_documentacion'],
            ], [
                'vencimiento_documentacion' => $cambio['vencimiento_documentacion'],
            ]);
        }

        $camposBasicos = ['tipo', 'operacion', 'vin', 'numero_economico', 'marca', 'modelo', 'placas'];
        foreach ($camposBasicos as $campo) {
            if (array_key_exists($campo, $cambio) && $cambio[$campo] !== $unidad[$campo]) {
                $this->unidades->update($id, [$campo => $cambio[$campo]]);
                $this->auditoria->registrar($actor, "unidad.{$campo}", 'unidades', $id, [
                    $campo => $unidad[$campo],
                ], [
                    $campo => $cambio[$campo],
                ]);
            }
        }

        $db->transComplete();

        return $this->conConsolidado($id);
    }

    /**
     * @return array<string, mixed>
     */
    public function conConsolidado(int $id): array
    {
        $unidad = $this->unidades->porId($id);
        if ($unidad === null) {
            throw new NoEncontradoException('Unidad no encontrada.');
        }

        $kpis = $this->consolidado->deUnidad($id);

        return [
            'id'                     => (int) $unidad['id'],
            'id_unidad'              => (string) $unidad['id_unidad'],
            'tipo'                   => (string) $unidad['tipo'],
            'estado'                 => (string) $unidad['estado'],
            'fecha_alta'             => (string) $unidad['fecha_alta'],
            'valor_referencia'       => $unidad['valor_referencia'] === null ? null : (float) $unidad['valor_referencia'],
            'costo_real_acumulado'   => $kpis['costo_real_acumulado'],
            'candidata_reincidencia'     => (bool) $unidad['candidata_reincidencia'],
            'vencimiento_documentacion' => $unidad['vencimiento_documentacion'] === null ? null : (string) $unidad['vencimiento_documentacion'],
        ];
    }
}
