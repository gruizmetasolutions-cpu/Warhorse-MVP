<?php

declare(strict_types=1);

namespace App\Controllers\Api\V1;

use App\Controllers\BaseController;
use App\Exceptions\ConflictoException;
use App\Exceptions\NoEncontradoException;
use App\Exceptions\ValidacionException;
use App\Libraries\ActorActual;
use App\Libraries\RespuestasApi;
use App\Services\TallerService;
use CodeIgniter\HTTP\IncomingRequest;
use CodeIgniter\HTTP\ResponseInterface;

/**
 * Módulo Taller (doc 05 §7). RF-TAL-01..04.
 */
final class TallerController extends BaseController
{
    public function index(): ResponseInterface
    {
        return $this->response->setJSON(['data' => (new TallerService())->listar()]);
    }

    public function create(): ResponseInterface
    {
        $request = $this->request;
        $datos   = $request instanceof IncomingRequest ? (array) $request->getJSON(true) : [];

        if (! $this->validateData($datos, [
            'unidad_id'     => 'required|is_natural_no_zero',
            'fecha_ingreso' => 'required|valid_date[Y-m-d]',
            'diagnostico'   => 'required|string|max_length[255]',
            'criticidad'    => 'required|in_list[Rápida,Media,Crítico]',
        ])) {
            $errores = $this->validator?->getErrors() ?? [];

            return RespuestasApi::error(422, 'validation', 'Datos del ingreso inválidos.', array_map(static fn (string $e): array => [$e], $errores));
        }

        try {
            $registro = (new TallerService())->registrarIngreso($datos, ActorActual::usuario());
        } catch (ValidacionException $e) {
            return RespuestasApi::error(422, 'validation', $e->getMessage(), $e->fields);
        }

        return $this->response->setStatusCode(201)->setJSON($registro);
    }

    public function liberar(int $id): ResponseInterface
    {
        $request = $this->request;
        $datos   = $request instanceof IncomingRequest ? (array) $request->getJSON(true) : [];

        if (! $this->validateData($datos, [
            'tipo_liberacion' => 'required|in_list[Total,Parcial]',
            'fecha_salida'    => 'required|valid_date[Y-m-d]',
            'costo_taller'    => 'required|decimal|greater_than_equal_to[0]',
        ])) {
            $errores = $this->validator?->getErrors() ?? [];

            return RespuestasApi::error(422, 'validation', 'Datos de la liberación inválidos.', array_map(static fn (string $e): array => [$e], $errores));
        }

        try {
            $registro = (new TallerService())->liberar($id, $datos, ActorActual::usuario());
        } catch (ValidacionException $e) {
            return RespuestasApi::error(422, 'validation', $e->getMessage(), $e->fields);
        } catch (ConflictoException $e) {
            return RespuestasApi::error(409, 'conflict', $e->getMessage());
        } catch (NoEncontradoException $e) {
            return RespuestasApi::error(404, 'not_found', $e->getMessage());
        }

        return $this->response->setJSON($registro);
    }
}
