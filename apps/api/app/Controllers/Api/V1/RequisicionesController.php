<?php

declare(strict_types=1);

namespace App\Controllers\Api\V1;

use App\Controllers\BaseController;
use App\Exceptions\ConflictoException;
use App\Exceptions\NoEncontradoException;
use App\Exceptions\ProhibidoException;
use App\Exceptions\ValidacionException;
use App\Libraries\ActorActual;
use App\Libraries\RespuestasApi;
use App\Services\RequisicionService;
use CodeIgniter\HTTP\IncomingRequest;
use CodeIgniter\HTTP\ResponseInterface;

/**
 * Requisiciones de refacciones (doc 05 §5). RF-REQ-01..07.
 */
final class RequisicionesController extends BaseController
{
    public function create(): ResponseInterface
    {
        $request = $this->request;
        if (! $request instanceof IncomingRequest) {
            return RespuestasApi::error(400, 'validation', 'Petición malformada.');
        }

        $datos = $request->getPost();

        if (! $this->validateData($datos, [
            'unidad_destino_id'     => 'permit_empty|is_natural_no_zero',
            'origen'                => 'required|in_list[Compra,Yonke,Inventario]',
            'pieza_catalogo_id'     => 'permit_empty|is_natural_no_zero',
            'origen_refaccion'      => 'permit_empty|string|max_length[180]',
            'almacen'               => 'permit_empty|string|max_length[100]',
            'numero_serie'          => 'permit_empty|string|max_length[80]',
            'descripcion_pieza'     => 'required|string|max_length[350]',
            'urgencia'              => 'permit_empty|in_list[Bajo,Medio,Crítico,Inmediato]',
            'numero_parte'          => 'permit_empty|string|max_length[80]',
            'costo_estimado_manual' => 'permit_empty|decimal|greater_than[0]',
        ])) {
            $errores = $this->validator?->getErrors() ?? [];
            $mensaje = isset($errores['descripcion_pieza']) ? 'Describe la pieza solicitada.' : 'Datos de la requisición inválidos.';

            return RespuestasApi::error(422, 'validation', $mensaje, array_map(static fn (string $e): array => [$e], $errores));
        }

        try {
            $fotos = [];
            foreach (['foto_pieza', 'foto_pieza_2', 'foto_pieza_3'] as $fName) {
                $file = $request->getFile($fName);
                if ($file !== null && $file->isValid()) {
                    $fotos[] = $file;
                }
            }
            $requisicion = (new RequisicionService())->crear(
                $datos,
                $fotos,
                ActorActual::usuario(),
            );
        } catch (ValidacionException $e) {
            return RespuestasApi::error(422, 'validation', $e->getMessage(), $e->fields);
        } catch (ConflictoException $e) {
            return RespuestasApi::error(409, 'conflict', $e->getMessage());
        }

        return $this->response->setStatusCode(201)->setJSON($requisicion);
    }

    public function index(): ResponseInterface
    {
        $request = $this->request;
        $filtros = [];
        if ($request instanceof IncomingRequest) {
            foreach (['estado', 'unidad_destino_id', 'unidad_donante_id'] as $filtro) {
                $valor = $request->getGet($filtro);
                if (is_string($valor) && $valor !== '') {
                    $filtros[$filtro] = $valor;
                }
            }
        }

        $data = (new RequisicionService())->listar(ActorActual::usuario(), $filtros);

        return $this->response->setJSON(['data' => $data]);
    }

    public function foto(int $id): ResponseInterface
    {
        $index = (int) ($this->request->getGet('index') ?? 0);
        try {
            $ruta = (new RequisicionService())->rutaFotoAutorizada($id, ActorActual::usuario(), $index);
        } catch (ProhibidoException $e) {
            return RespuestasApi::error(403, 'forbidden', $e->getMessage());
        } catch (NoEncontradoException $e) {
            return RespuestasApi::error(404, 'not_found', $e->getMessage());
        }

        $mime   = mime_content_type($ruta) ?: 'application/octet-stream';
        $cuerpo = (string) file_get_contents($ruta);

        return $this->response->setContentType($mime)->setBody($cuerpo);
    }

    public function delete(int $id): ResponseInterface
    {
        $actor = ActorActual::usuario();
        if ($actor['rol'] !== 'admin') {
            return RespuestasApi::error(403, 'forbidden', 'Solo el administrador puede eliminar requisiciones.');
        }

        try {
            (new RequisicionService())->eliminar($id, $actor);
        } catch (NoEncontradoException $e) {
            return RespuestasApi::error(404, 'not_found', $e->getMessage());
        } catch (ConflictoException $e) {
            return RespuestasApi::error(409, 'conflict', $e->getMessage());
        }

        return $this->response->setStatusCode(204);
    }

    public function documento(int $id, string $tipo): ResponseInterface
    {
        try {
            $ruta = (new RequisicionService())->rutaDocumentoAutorizada($id, ActorActual::usuario(), $tipo);
        } catch (ProhibidoException $e) {
            return RespuestasApi::error(403, 'forbidden', $e->getMessage());
        } catch (NoEncontradoException $e) {
            return RespuestasApi::error(404, 'not_found', $e->getMessage());
        }

        $mime   = mime_content_type($ruta) ?: 'application/octet-stream';
        $cuerpo = (string) file_get_contents($ruta);

        return $this->response->setContentType($mime)->setBody($cuerpo);
    }
}
