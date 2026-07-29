<?php

declare(strict_types=1);

namespace App\Controllers\Api\V1;

use App\Controllers\BaseController;
use App\Libraries\RespuestasApi;
use CodeIgniter\HTTP\IncomingRequest;
use CodeIgniter\HTTP\ResponseInterface;

final class OrdenesTrabajoController extends BaseController
{
    public function listar(): ResponseInterface
    {
        $db = \Config\Database::connect();
        $builder = $db->table('ordenes_trabajo ot')
            ->select('ot.id, ot.diagnostico, ot.materiales, ot.archivos_evidencia, ot.created_at, u.id_unidad, u.tipo as unidad_tipo, r.nombre as responsable_nombre, r.rol as responsable_rol')
            ->join('unidades u', 'u.id = ot.unidad_id')
            ->join('responsables_taller r', 'r.id = ot.responsable_id')
            ->orderBy('ot.id', 'DESC');

        $filas = $builder->get()->getResultArray();

        return $this->response->setJSON([
            'data' => array_map(static fn (array $f): array => [
                'id'                 => (int) $f['id'],
                'diagnostico'        => (string) $f['diagnostico'],
                'materiales'         => json_decode((string) ($f['materiales'] ?? '[]'), true),
                'archivos_evidencia' => json_decode((string) ($f['archivos_evidencia'] ?? '[]'), true),
                'created_at'         => (string) $f['created_at'],
                'unidad' => [
                    'id_unidad' => (string) $f['id_unidad'],
                    'tipo'      => (string) $f['unidad_tipo'],
                ],
                'responsable' => [
                    'nombre' => (string) $f['responsable_nombre'],
                    'rol'    => (string) $f['responsable_rol'],
                ],
            ], $filas),
        ]);
    }

    public function crear(): ResponseInterface
    {
        $request = $this->request;
        $datos   = $request instanceof IncomingRequest ? (array) $request->getJSON(true) : [];

        if (! $this->validateData($datos, [
            'unidad_id'          => 'required|is_natural_no_zero',
            'responsable_id'     => 'required|is_natural_no_zero',
            'diagnostico'        => 'required|min_length[5]',
            'materiales'         => 'permit_empty',
            'archivos_evidencia' => 'permit_empty',
        ])) {
            $errores = $this->validator?->getErrors() ?? [];
            return RespuestasApi::error(422, 'validation', 'Datos de orden de trabajo inválidos.', array_map(static fn (string $e): array => [$e], $errores));
        }

        $db = \Config\Database::connect();
        
        // Verify unit
        $unidad = $db->table('unidades')->where('id', $datos['unidad_id'])->get()->getRowArray();
        if ($unidad === null) {
            return RespuestasApi::error(404, 'not_found', 'Unidad no encontrada.');
        }

        // Verify responsible
        $resp = $db->table('responsables_taller')->where('id', $datos['responsable_id'])->get()->getRowArray();
        if ($resp === null) {
            return RespuestasApi::error(404, 'not_found', 'Responsable de taller no encontrado.');
        }

        $materiales = isset($datos['materiales']) ? json_encode($datos['materiales']) : '[]';
        $evidencias = isset($datos['archivos_evidencia']) ? json_encode($datos['archivos_evidencia']) : '[]';

        $db->table('ordenes_trabajo')->insert([
            'unidad_id'          => (int) $datos['unidad_id'],
            'responsable_id'     => (int) $datos['responsable_id'],
            'diagnostico'        => trim((string) $datos['diagnostico']),
            'materiales'         => $materiales,
            'archivos_evidencia' => $evidencias,
        ]);

        $otId = $db->insertID();

        return $this->response->setStatusCode(201)->setJSON([
            'id' => $otId,
            'message' => 'Orden de trabajo creada exitosamente.',
        ]);
    }

    public function responsables(): ResponseInterface
    {
        $db = \Config\Database::connect();
        $filas = $db->table('responsables_taller')->orderBy('nombre', 'ASC')->get()->getResultArray();

        return $this->response->setJSON([
            'data' => array_map(static fn (array $f): array => [
                'id'     => (int) $f['id'],
                'nombre' => (string) $f['nombre'],
                'rol'    => (string) $f['rol'],
            ], $filas),
        ]);
    }

    public function crearResponsable(): ResponseInterface
    {
        $request = $this->request;
        $datos   = $request instanceof IncomingRequest ? (array) $request->getJSON(true) : [];

        if (! $this->validateData($datos, [
            'nombre' => 'required|min_length[3]|max_length[120]',
            'rol'    => 'required|in_list[Mecánico A,Mecánico B,Auxiliares,Termoquineros,Desponchadores]',
        ])) {
            $errores = $this->validator?->getErrors() ?? [];
            return RespuestasApi::error(422, 'validation', 'Datos de responsable inválidos.', array_map(static fn (string $e): array => [$e], $errores));
        }

        $db = \Config\Database::connect();
        $db->table('responsables_taller')->insert([
            'nombre' => trim((string) $datos['nombre']),
            'rol'    => $datos['rol'],
        ]);

        return $this->response->setStatusCode(201)->setJSON([
            'id' => $db->insertID(),
            'message' => 'Responsable creado exitosamente.',
        ]);
    }
}
