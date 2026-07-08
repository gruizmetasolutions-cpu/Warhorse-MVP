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
        if ($request instanceof IncomingRequest) {
            $valor     = $request->getGet('seleccion');
            $seleccion = is_string($valor) && $valor !== '' ? $valor : null;
        }

        return $this->response->setJSON((new DashboardService())->armar($seleccion));
    }
}
