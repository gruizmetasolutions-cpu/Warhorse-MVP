<?php

declare(strict_types=1);

namespace App\Controllers\Api\V1;

use App\Controllers\BaseController;
use App\Services\AuditoriaService;
use CodeIgniter\HTTP\IncomingRequest;
use CodeIgniter\HTTP\ResponseInterface;

/**
 * Bitácora de auditoría (doc 05 §9). RF-INT-05.
 */
final class AuditoriaController extends BaseController
{
    public function index(): ResponseInterface
    {
        $request = $this->request;
        $filtros = [];
        $pagina  = 1;
        $porPag  = 25;
        if ($request instanceof IncomingRequest) {
            $filtros = [
                'entidad'    => $this->texto($request->getGet('entidad')),
                'accion'     => $this->texto($request->getGet('accion')),
                'entidad_id' => (int) ($request->getGet('entidad_id') ?? 0) ?: null,
                'actor_id'   => (int) ($request->getGet('actor_id') ?? 0) ?: null,
                'desde'      => $this->fecha($request->getGet('desde')),
                'hasta'      => $this->fecha($request->getGet('hasta')),
            ];
            $pagina = max(1, (int) ($request->getGet('page') ?? 1));
            $porPag = min(100, max(1, (int) ($request->getGet('per_page') ?? 25)));
        }

        $listado = (new AuditoriaService())->listar($filtros, $pagina, $porPag);

        return $this->response->setJSON([
            'data' => $listado['data'],
            'meta' => [
                'page'        => $pagina,
                'per_page'    => $porPag,
                'total'       => $listado['total'],
                'total_pages' => (int) ceil($listado['total'] / $porPag),
            ],
        ]);
    }

    private function texto(mixed $valor): ?string
    {
        return is_string($valor) && $valor !== '' ? $valor : null;
    }

    private function fecha(mixed $valor): ?string
    {
        return is_string($valor) && preg_match('/^\d{4}-\d{2}-\d{2}$/', $valor) === 1 ? $valor : null;
    }
}
