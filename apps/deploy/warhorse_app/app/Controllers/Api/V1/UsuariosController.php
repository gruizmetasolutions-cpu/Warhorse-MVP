<?php

declare(strict_types=1);

namespace App\Controllers\Api\V1;

use App\Controllers\BaseController;
use App\Exceptions\ConflictoException;
use App\Exceptions\NoEncontradoException;
use App\Libraries\ActorActual;
use App\Libraries\RespuestasApi;
use App\Services\UsuarioService;
use CodeIgniter\HTTP\IncomingRequest;
use CodeIgniter\HTTP\ResponseInterface;

/**
 * Usuarios y permisos (doc 05 §9). RF-USR-01/02.
 */
final class UsuariosController extends BaseController
{
    public function index(): ResponseInterface
    {
        return $this->response->setJSON(['data' => (new UsuarioService())->listar()]);
    }

    public function create(): ResponseInterface
    {
        $request = $this->request;
        $datos   = $request instanceof IncomingRequest ? (array) $request->getJSON(true) : [];

        if (! $this->validateData($datos, [
            'nombre' => 'required|string|min_length[2]|max_length[120]',
            'email'  => 'required|valid_email|max_length[180]',
            'rol'    => 'required|in_list[admin,taller,compras,diesel]',
        ])) {
            $errores = $this->validator?->getErrors() ?? [];

            return RespuestasApi::error(422, 'validation', 'Datos del usuario inválidos.', array_map(static fn (string $e): array => [$e], $errores));
        }

        try {
            $usuario = (new UsuarioService())->alta([
                'nombre' => trim((string) $datos['nombre']),
                'email'  => strtolower(trim((string) $datos['email'])),
                'rol'    => (string) $datos['rol'],
            ], ActorActual::usuario());
        } catch (ConflictoException $e) {
            return RespuestasApi::error(409, 'conflict', $e->getMessage());
        }

        return $this->response->setStatusCode(201)->setJSON($usuario);
    }

    public function update(int $id): ResponseInterface
    {
        $request = $this->request;
        $cambio  = $request instanceof IncomingRequest ? (array) $request->getJSON(true) : [];

        if (array_key_exists('rol', $cambio) && ! in_array($cambio['rol'], ['admin', 'taller', 'compras', 'diesel'], true)) {
            return RespuestasApi::error(422, 'validation', 'Cambio de usuario inválido.', ['rol' => ['in_list']]);
        }
        // El booleano llega como true/false del JSON (no pasa por in_list)
        if (array_key_exists('activo', $cambio) && ! is_bool($cambio['activo']) && ! in_array($cambio['activo'], [0, 1, '0', '1'], true)) {
            return RespuestasApi::error(422, 'validation', 'Cambio de usuario inválido.', ['activo' => ['boolean']]);
        }

        try {
            $usuario = (new UsuarioService())->actualizar($id, $cambio, ActorActual::usuario());
        } catch (NoEncontradoException $e) {
            return RespuestasApi::error(404, 'not_found', $e->getMessage());
        }

        return $this->response->setJSON($usuario);
    }
}
