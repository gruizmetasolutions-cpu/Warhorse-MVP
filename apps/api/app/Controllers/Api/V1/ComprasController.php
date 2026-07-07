<?php

declare(strict_types=1);

namespace App\Controllers\Api\V1;

use App\Controllers\BaseController;
use App\Exceptions\ConflictoException;
use App\Exceptions\NoEncontradoException;
use App\Exceptions\ValidacionException;
use App\Libraries\ActorActual;
use App\Libraries\RespuestasApi;
use App\Services\RequisicionService;
use CodeIgniter\HTTP\IncomingRequest;
use CodeIgniter\HTTP\ResponseInterface;

/**
 * Panel de Compras (doc 05 §6). RF-COM-01..04.
 */
final class ComprasController extends BaseController
{
    public function index(): ResponseInterface
    {
        $request = $this->request;
        $estado  = null;
        if ($request instanceof IncomingRequest) {
            $valor  = $request->getGet('estado');
            $estado = is_string($valor) && $valor !== '' ? $valor : null;
        }

        if ($estado !== null && ! in_array($estado, ['Solicitado', 'Cotizado', 'Comprado', 'Instalado'], true)) {
            return RespuestasApi::error(422, 'validation', 'Estado de requisición inválido.', ['estado' => ['in_list']]);
        }

        return $this->response->setJSON([
            'data' => (new RequisicionService())->listarCola($estado),
        ]);
    }

    public function estado(int $id): ResponseInterface
    {
        $request = $this->request;
        $cambio  = $request instanceof IncomingRequest ? (array) $request->getJSON(true) : [];

        if (! $this->validateData($cambio, [
            'estado'         => 'required|in_list[Cotizado,Comprado,Instalado]',
            'costo_real'     => 'permit_empty|decimal|greater_than[0]',
            'numero_factura' => 'permit_empty|string|max_length[80]',
        ])) {
            $errores = $this->validator?->getErrors() ?? [];

            return RespuestasApi::error(422, 'validation', 'Cambio de estado inválido.', array_map(static fn (string $e): array => [$e], $errores));
        }

        try {
            $requisicion = (new RequisicionService())->avanzarEstado($id, $cambio, ActorActual::usuario());
        } catch (ValidacionException $e) {
            return RespuestasApi::error(422, 'validation', $e->getMessage(), array_filter($e->fields));
        } catch (ConflictoException $e) {
            return RespuestasApi::error(409, 'conflict', $e->getMessage());
        } catch (NoEncontradoException $e) {
            return RespuestasApi::error(404, 'not_found', $e->getMessage());
        }

        return $this->response->setJSON($requisicion);
    }
}
