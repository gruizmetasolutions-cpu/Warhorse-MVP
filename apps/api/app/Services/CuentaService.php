<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\UsuarioModel;
use CodeIgniter\Shield\Entities\User;

/**
 * Puente entre la tabla de dominio `usuarios` y las identidades de Shield
 * (vínculo 1:1 por email, doc 03 nota de `usuarios`).
 */
final class CuentaService
{
    public function __construct(private readonly UsuarioModel $usuarios = new UsuarioModel())
    {
    }

    /**
     * Crea la cuenta completa: fila de dominio + usuario Shield + grupo(=rol).
     *
     * @param array{nombre: string, email: string, rol: string, activo?: int|bool} $datos
     */
    public function crear(array $datos, string $password): int
    {
        $this->usuarios->insert([
            'nombre'        => $datos['nombre'],
            'email'         => $datos['email'],
            'password_hash' => password_hash($password, PASSWORD_DEFAULT),
            'rol'           => $datos['rol'],
            'activo'        => (int) ($datos['activo'] ?? 1),
        ]);
        $dominioId = (int) $this->usuarios->getInsertID();

        $proveedor = auth()->getProvider();
        $shield    = new User([
            'username' => strstr($datos['email'], '@', true) ?: $datos['email'],
            'email'    => $datos['email'],
            'password' => $password,
            'active'   => true,
        ]);
        $proveedor->save($shield);

        $shield = $proveedor->findById((int) $proveedor->getInsertID());
        if ($shield === null) {
            throw new \RuntimeException('No se pudo crear la identidad Shield de ' . $datos['email']);
        }
        $shield->addGroup($datos['rol']);

        return $dominioId;
    }

    /**
     * Usuario de dominio activo por email; null si no existe o está suspendido.
     *
     * @return array<string, mixed>|null
     */
    public function activoPorEmail(string $email): ?array
    {
        $usuario = $this->usuarios->porEmail($email);
        if ($usuario === null || (int) $usuario['activo'] !== 1) {
            return null;
        }

        return $usuario;
    }
}
