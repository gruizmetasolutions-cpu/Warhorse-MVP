<?php

declare(strict_types=1);

namespace App\Controllers\Api\V1;

use App\Controllers\BaseController;
use App\Services\MetricasService;
use CodeIgniter\HTTP\ResponseInterface;

/**
 * Salud de datos (SRS §9): solo Dirección.
 */
final class MetricasController extends BaseController
{
    public function salud(): ResponseInterface
    {
        return $this->response->setJSON((new MetricasService())->salud());
    }
}
