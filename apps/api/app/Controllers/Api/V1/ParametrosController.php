<?php

declare(strict_types=1);

namespace App\Controllers\Api\V1;

use App\Controllers\BaseController;
use App\Libraries\ActorActual;
use App\Libraries\RespuestasApi;
use App\Services\ParametrosService;
use CodeIgniter\HTTP\IncomingRequest;
use CodeIgniter\HTTP\ResponseInterface;

/**
 * Parámetros del veredicto (doc 05 §8). RF-DASH-05.
 */
final class ParametrosController extends BaseController
{
    public function obtener(): ResponseInterface
    {
        $parametros = (new ParametrosService())->obtener();

        return $this->response->setJSON([
            'umbral_pct'    => $parametros['umbral_pct'],
            'ventana_meses' => $parametros['ventana_meses'],
        ]);
    }

    public function actualizar(): ResponseInterface
    {
        $request = $this->request;
        $datos   = $request instanceof IncomingRequest ? (array) $request->getJSON(true) : [];

        // Rangos del contrato: umbral 20–80, ventana 1–36 (doc 05 §8)
        if (! $this->validateData($datos, [
            'umbral_pct'    => 'required|is_natural|greater_than_equal_to[20]|less_than_equal_to[80]',
            'ventana_meses' => 'required|is_natural|greater_than_equal_to[1]|less_than_equal_to[36]',
        ])) {
            $errores = $this->validator?->getErrors() ?? [];

            return RespuestasApi::error(422, 'validation', 'Parámetros fuera de rango.', array_map(static fn (string $e): array => [$e], $errores));
        }

        $parametros = (new ParametrosService())->actualizar($datos, ActorActual::usuario());

        return $this->response->setJSON($parametros);
    }
}
