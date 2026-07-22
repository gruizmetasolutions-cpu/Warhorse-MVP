<?php

declare(strict_types=1);

namespace App\Controllers\Api\V1;

use App\Controllers\BaseController;
use App\Exceptions\ValidacionException;
use App\Libraries\ActorActual;
use App\Libraries\RespuestasApi;
use App\Services\DieselService;
use CodeIgniter\HTTP\IncomingRequest;
use CodeIgniter\HTTP\ResponseInterface;

/**
 * Módulo Diésel (doc 05 §4). RF-DIE-01..03.
 */
final class DieselController extends BaseController
{
    public function index(): ResponseInterface
    {
        $request  = $this->request;
        $unidadId = null;
        $desde    = null;
        $hasta    = null;
        $pagina   = 1;
        $porPag   = 25;
        if ($request instanceof IncomingRequest) {
            $unidadId = (int) ($request->getGet('unidad_id') ?? 0) ?: null;
            $desde    = $this->fecha($request->getGet('desde'));
            $hasta    = $this->fecha($request->getGet('hasta'));
            $pagina   = max(1, (int) ($request->getGet('page') ?? 1));
            $porPag   = min(100, max(1, (int) ($request->getGet('per_page') ?? 25)));
        }

        $listado = (new DieselService())->listar($unidadId, $desde, $hasta, $pagina, $porPag);

        return $this->response->setJSON([
            'data' => array_map(static fn (array $d): array => [
                'id'            => (int) $d['id'],
                'unidad_id'     => (int) $d['unidad_id'],
                'id_unidad'     => (string) $d['id_unidad'],
                'fecha'         => (string) $d['fecha'],
                'litros'        => (float) $d['litros'],
                'costo_total'   => (float) $d['costo_total'],
                'km_recorridos' => (int) $d['km_recorridos'],
            ], $listado['data']),
            'meta' => [
                'page'        => $pagina,
                'per_page'    => $porPag,
                'total'       => $listado['total'],
                'total_pages' => (int) ceil($listado['total'] / $porPag),
            ],
        ]);
    }

    public function create(): ResponseInterface
    {
        $request = $this->request;
        $datos   = $request instanceof IncomingRequest ? (array) $request->getJSON(true) : [];

        // RF-DIE-01: validación numérica estricta (doc 05 §4)
        if (! $this->validateData($datos, [
            'unidad_id'     => 'required|is_natural_no_zero',
            'fecha'         => 'required|valid_date[Y-m-d]',
            'litros'        => 'required|decimal|greater_than[0]',
            'costo_total'   => 'required|decimal|greater_than[0]',
            'km_recorridos' => 'required|is_natural',
        ])) {
            $errores = $this->validator?->getErrors() ?? [];

            return RespuestasApi::error(422, 'validation', 'Datos de la carga inválidos.', array_map(static fn (string $e): array => [$e], $errores));
        }

        try {
            $registro = (new DieselService())->registrar($datos, ActorActual::usuario());
        } catch (ValidacionException $e) {
            return RespuestasApi::error(422, 'validation', $e->getMessage(), $e->fields);
        }

        return $this->response->setStatusCode(201)->setJSON($registro);
    }

    private function fecha(mixed $valor): ?string
    {
        return is_string($valor) && preg_match('/^\d{4}-\d{2}-\d{2}$/', $valor) === 1 ? $valor : null;
    }
}
