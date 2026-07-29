<?php

declare(strict_types=1);

namespace App\Controllers\Api\V1;

use App\Controllers\BaseController;
use App\Services\DashboardService;
use CodeIgniter\HTTP\IncomingRequest;
use CodeIgniter\HTTP\ResponseInterface;

/**
 * Dashboard de Dirección (doc 05 §8). RF-DASH-01..06.
 */
final class DashboardController extends BaseController
{
    public function index(): ResponseInterface
    {
        $request   = $this->request;
        $seleccion = null;
        $tipo      = null;
        $desde     = null;
        $hasta     = null;
        if ($request instanceof IncomingRequest) {
            $valor      = $request->getGet('seleccion');
            $seleccion  = is_string($valor) && $valor !== '' ? $valor : null;
            $valorTipo  = $request->getGet('tipo');
            $tipo       = is_string($valorTipo) && $valorTipo !== '' ? $valorTipo : null;
            $valorDesde = $request->getGet('desde');
            $desde      = is_string($valorDesde) && $valorDesde !== '' ? $valorDesde : null;
            $valorHasta = $request->getGet('hasta');
            $hasta      = is_string($valorHasta) && $valorHasta !== '' ? $valorHasta : null;
        }

        return $this->response->setJSON((new DashboardService())->armar($seleccion, $tipo, $desde, $hasta));
    }
}
