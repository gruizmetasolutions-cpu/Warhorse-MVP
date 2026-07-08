<?php

declare(strict_types=1);

namespace App\Services;

use App\Exceptions\ValidacionException;
use App\Libraries\Bd;
use App\Models\RegistroDieselModel;
use App\Models\UnidadModel;

/**
 * Módulo Diésel (RF-DIE-01..03): registro de cargas con actualización del
 * consolidado en la misma transacción y listado filtrable por unidad/fechas.
 */
final class DieselService
{
    public function __construct(
        private readonly RegistroDieselModel $registros = new RegistroDieselModel(),
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
    public function registrar(array $datos, array $actor): array
    {
        $unidad = $this->unidades->porId((int) ($datos['unidad_id'] ?? 0));
        if ($unidad === null) {
            // RF-INT-01: la carga se valida contra el catálogo, sin huérfanas
            throw new ValidacionException('La unidad no existe en el catálogo.', [
                'unidad_id' => ['La unidad no existe en el catálogo.'],
            ]);
        }

        $costo = (float) $datos['costo_total'];

        $db = db_connect();
        $db->transStart();

        $this->registros->insert([
            'unidad_id'     => (int) $unidad['id'],
            'fecha'         => $datos['fecha'],
            'litros'        => (float) $datos['litros'],
            'costo_total'   => $costo,
            'km_recorridos' => (int) $datos['km_recorridos'],
            'capturado_por' => (int) $actor['id'],
        ]);
        $id = (int) $this->registros->getInsertID();

        // RF-DIE-02: el consolidado de la unidad se actualiza al capturar
        $this->consolidado->agregarDiesel((int) $unidad['id'], $costo);

        // RF-INT-05: evento crítico auditado dentro de la transacción
        $this->auditoria->registrar($actor, 'diesel.carga', 'registros_diesel', $id, null, [
            'unidad_id'     => (int) $unidad['id'],
            'fecha'         => $datos['fecha'],
            'litros'        => (float) $datos['litros'],
            'costo_total'   => $costo,
            'km_recorridos' => (int) $datos['km_recorridos'],
        ]);

        $db->transComplete();

        $fila = $this->registros->porId($id);
        if ($fila !== null) {
            $fila['id_unidad'] = (string) $unidad['id_unidad'];
        }

        return $fila ?? [];
    }

    /**
     * Listado con filtros del contrato (?unidad_id=&desde=&hasta=) y paginación.
     *
     * @return array{data: list<array<string, mixed>>, total: int}
     */
    public function listar(?int $unidadId, ?string $desde, ?string $hasta, int $pagina, int $porPagina): array
    {
        $filtrado = static function () use ($unidadId, $desde, $hasta) {
            $builder = db_connect()->table('registros_diesel d');
            if ($unidadId !== null) {
                $builder->where('d.unidad_id', $unidadId);
            }
            if ($desde !== null) {
                $builder->where('d.fecha >=', $desde);
            }
            if ($hasta !== null) {
                $builder->where('d.fecha <=', $hasta);
            }

            return $builder;
        };

        $total = (int) $filtrado()->countAllResults();

        $filas = Bd::filas(
            $filtrado()
                ->select('d.*, u.id_unidad')
                ->join('unidades u', 'u.id = d.unidad_id')
                ->orderBy('d.fecha', 'DESC')
                ->orderBy('d.id', 'DESC')
                ->limit($porPagina, ($pagina - 1) * $porPagina),
        );

        return ['data' => $filas, 'total' => $total];
    }
}
