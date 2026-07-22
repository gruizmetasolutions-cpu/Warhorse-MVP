<?php

declare(strict_types=1);

namespace App\Controllers\Api\V1;

use App\Controllers\BaseController;
use App\Libraries\RespuestasApi;
use App\Models\CatalogoPiezaModel;
use CodeIgniter\HTTP\IncomingRequest;
use CodeIgniter\HTTP\ResponseInterface;

final class AlmacenController extends BaseController
{
    public function articulos(): ResponseInterface
    {
        $model = new CatalogoPiezaModel();
        $articulos = $model->orderBy('nombre_normalizado', 'ASC')->findAll();
        
        return $this->response->setJSON([
            'data' => array_map(static fn (array $a): array => [
                'id'                 => (int) $a['id'],
                'nombre_normalizado' => (string) $a['nombre_normalizado'],
                'numero_parte'       => $a['numero_parte'],
                'precio_referencia'  => $a['precio_referencia'] === null ? null : (float) $a['precio_referencia'],
                'stock_minimo'       => $a['stock_minimo'] === null ? null : (int) $a['stock_minimo'],
                'stock_maximo'       => $a['stock_maximo'] === null ? null : (int) $a['stock_maximo'],
            ], $articulos),
        ]);
    }

    public function actualizar(int $id): ResponseInterface
    {
        $request = $this->request;
        $datos   = $request instanceof IncomingRequest ? (array) $request->getJSON(true) : [];

        if (! $this->validateData($datos, [
            'stock_minimo' => 'permit_empty|is_natural',
            'stock_maximo' => 'permit_empty|is_natural',
        ])) {
            $errores = $this->validator?->getErrors() ?? [];
            return RespuestasApi::error(422, 'validation', 'Datos de inventario inválidos.', array_map(static fn (string $e): array => [$e], $errores));
        }

        $model = new CatalogoPiezaModel();
        $articulo = $model->find($id);
        if ($articulo === null) {
            return RespuestasApi::error(404, 'not_found', 'Artículo no encontrado.');
        }

        $model->update($id, [
            'stock_minimo' => isset($datos['stock_minimo']) && $datos['stock_minimo'] !== '' ? (int) $datos['stock_minimo'] : null,
            'stock_maximo' => isset($datos['stock_maximo']) && $datos['stock_maximo'] !== '' ? (int) $datos['stock_maximo'] : null,
        ]);

        $actualizado = $model->find($id);

        return $this->response->setJSON([
            'id'                 => (int) $actualizado['id'],
            'nombre_normalizado' => (string) $actualizado['nombre_normalizado'],
            'numero_parte'       => $actualizado['numero_parte'],
            'precio_referencia'  => $actualizado['precio_referencia'] === null ? null : (float) $actualizado['precio_referencia'],
            'stock_minimo'       => $actualizado['stock_minimo'] === null ? null : (int) $actualizado['stock_minimo'],
            'stock_maximo'       => $actualizado['stock_maximo'] === null ? null : (int) $actualizado['stock_maximo'],
        ]);
    }
}
