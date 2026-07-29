<?php

declare(strict_types=1);

namespace App\Controllers\Api\V1;

use App\Controllers\BaseController;
use App\Exceptions\ConflictoException;
use App\Exceptions\NoEncontradoException;
use App\Libraries\ActorActual;
use App\Libraries\RespuestasApi;
use App\Models\UnidadModel;
use App\Services\FichaService;
use App\Services\UnidadService;
use CodeIgniter\HTTP\IncomingRequest;
use CodeIgniter\HTTP\ResponseInterface;

/**
 * Catálogo maestro de unidades (doc 05 §3). RF-UNI-01..05.
 */
final class UnidadesController extends BaseController
{
    public function index(): ResponseInterface
    {
        $request = $this->request;
        $estado  = null;
        $pagina  = 1;
        $porPag  = 25;
        if ($request instanceof IncomingRequest) {
            $estado = $request->getGet('estado');
            $estado = is_string($estado) && $estado !== '' ? $estado : null;
            $pagina = max(1, (int) ($request->getGet('page') ?? 1));
            $porPag = min(100, max(1, (int) ($request->getGet('per_page') ?? 25)));
        }

        if ($estado !== null && ! in_array($estado, ['Activo', 'Yonke', 'Inactivo', 'Vendido'], true)) {
            return RespuestasApi::error(422, 'validation', 'Estado de unidad inválido.', ['estado' => ['in_list']]);
        }

        $listado = (new UnidadModel())->listar($estado, $pagina, $porPag);

        return $this->response->setJSON([
            'data' => array_map(static fn (array $u): array => [
                'id'                        => (int) $u['id'],
                'id_unidad'                 => (string) $u['id_unidad'],
                'tipo'                      => (string) $u['tipo'],
                'estado'                    => (string) $u['estado'],
                'valor_referencia'          => $u['valor_referencia'] === null ? null : (float) $u['valor_referencia'],
                'costo_real_acumulado'      => (float) $u['costo_real_acumulado'],
                'candidata_reincidencia'    => (bool) $u['candidata_reincidencia'],
                'vencimiento_documentacion' => $u['vencimiento_documentacion'] === null ? null : (string) $u['vencimiento_documentacion'],
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

        if (! $this->validateData($datos, [
            'id_unidad'                 => 'required|string|max_length[20]',
            'tipo'                      => 'required|in_list[Tractor,Caja,Thermo,Servicio]',
            'estado'                    => 'permit_empty|in_list[Activo,Yonke,Inactivo,Vendido]',
            'fecha_alta'                => 'required|valid_date[Y-m-d]',
            'valor_referencia'          => 'permit_empty|decimal|greater_than_equal_to[0]',
            'vencimiento_documentacion' => 'permit_empty|valid_date[Y-m-d]',
        ])) {
            $errores = $this->validator?->getErrors() ?? [];

            return RespuestasApi::error(422, 'validation', 'Datos de la unidad inválidos.', array_map(static fn (string $e): array => [$e], $errores));
        }

        try {
            $unidad = (new UnidadService())->crear($datos, ActorActual::usuario());
        } catch (ConflictoException $e) {
            return RespuestasApi::error(409, 'conflict', $e->getMessage());
        }

        return $this->response->setStatusCode(201)->setJSON($unidad);
    }

    public function update(int $id): ResponseInterface
    {
        $request = $this->request;
        $cambio  = $request instanceof IncomingRequest ? (array) $request->getJSON(true) : [];

        if (! $this->validateData($cambio, [
            'estado'                    => 'permit_empty|in_list[Activo,Yonke,Inactivo,Vendido]',
            'valor_referencia'          => 'permit_empty|decimal|greater_than_equal_to[0]',
            'vencimiento_documentacion' => 'permit_empty|valid_date[Y-m-d]',
        ]) || $cambio === []) {
            $errores = $this->validator?->getErrors() ?? [];

            return RespuestasApi::error(422, 'validation', 'Cambio inválido.', array_map(static fn (string $e): array => [$e], $errores));
        }

        try {
            $unidad = (new UnidadService())->actualizar($id, $cambio, ActorActual::usuario());
        } catch (ConflictoException $e) {
            return RespuestasApi::error(409, 'conflict', $e->getMessage());
        } catch (NoEncontradoException $e) {
            return RespuestasApi::error(404, 'not_found', $e->getMessage());
        }

        return $this->response->setJSON($unidad);
    }

    public function ficha(int $id): ResponseInterface
    {
        try {
            $ficha = (new FichaService())->armar($id);
        } catch (NoEncontradoException $e) {
            return RespuestasApi::error(404, 'not_found', $e->getMessage());
        }

        return $this->response->setJSON($ficha);
    }
}
