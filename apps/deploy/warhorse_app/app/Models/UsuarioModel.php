<?php

declare(strict_types=1);

namespace App\Models;

use CodeIgniter\Model;

/**
 * Tabla de dominio `usuarios` (doc 03). Las credenciales viven en Shield
 * (auth_identities); el vínculo 1:1 es por email.
 */
class UsuarioModel extends Model
{
    protected $table         = 'usuarios';
    protected $primaryKey    = 'id';
    protected $returnType    = 'array';
    protected $allowedFields = ['nombre', 'email', 'password_hash', 'rol', 'activo', 'debe_cambiar_password'];
    protected $useTimestamps = true;

    /**
     * @return array<string, mixed>|null
     */
    public function porId(int $id): ?array
    {
        /** @var array<string, mixed>|null $fila */
        $fila = $this->find($id);

        return $fila;
    }

    /**
     * @return array<string, mixed>|null
     */
    public function porEmail(string $email): ?array
    {
        /** @var array<string, mixed>|null $fila */
        $fila = $this->where('email', $email)->first();

        return $fila;
    }
}
