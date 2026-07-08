<?php

declare(strict_types=1);

namespace App\Services;

use App\Exceptions\ConflictoException;
use App\Exceptions\NoEncontradoException;
use App\Libraries\Bd;
use App\Models\UsuarioModel;

/**
 * Administración de usuarios por Dirección (RF-USR-01/02): alta con
 * credenciales temporales por correo, suspensión/reactivación y cambio de
 * rol, todo auditado. Las credenciales viven en Shield vía CuentaService.
 */
final class UsuarioService
{
    public function __construct(
        private readonly UsuarioModel $usuarios = new UsuarioModel(),
        private readonly CuentaService $cuentas = new CuentaService(),
        private readonly AuditoriaService $auditoria = new AuditoriaService(),
    ) {
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function listar(): array
    {
        $filas = Bd::filas(
            db_connect()->table('usuarios')
                ->select('id, nombre, email, rol, activo, created_at')
                ->orderBy('nombre', 'ASC'),
        );

        return array_map(static fn (array $u): array => [
            'id'     => (int) $u['id'],
            'nombre' => (string) $u['nombre'],
            'email'  => (string) $u['email'],
            'rol'    => (string) $u['rol'],
            'activo' => (bool) $u['activo'],
        ], $filas);
    }

    /**
     * @param array{nombre: string, email: string, rol: string} $datos
     * @param array<string, mixed>                              $actor
     *
     * @return array<string, mixed>
     */
    public function alta(array $datos, array $actor): array
    {
        if ($this->usuarios->porEmail($datos['email']) !== null) {
            throw new ConflictoException('Ya existe un usuario con ese correo.');
        }

        // Contraseña temporal generada server-side; viaja SOLO por correo
        $temporal = bin2hex(random_bytes(6));

        $db = db_connect();
        $db->transStart();

        $id = $this->cuentas->crear([
            'nombre' => $datos['nombre'],
            'email'  => $datos['email'],
            'rol'    => $datos['rol'],
        ], $temporal);

        $this->auditoria->registrar($actor, 'usuario.alta', 'usuarios', $id, null, [
            'nombre' => $datos['nombre'],
            'email'  => $datos['email'],
            'rol'    => $datos['rol'],
        ]);

        $db->transComplete();

        // RF-USR-01: credenciales por correo (cola; en dev, log)
        service('queue')->push('notificaciones', 'correo-credenciales', [
            'nombre'            => $datos['nombre'],
            'email'             => $datos['email'],
            'password_temporal' => $temporal,
        ]);

        return [
            'id'     => $id,
            'nombre' => $datos['nombre'],
            'email'  => $datos['email'],
            'rol'    => $datos['rol'],
            'activo' => true,
        ];
    }

    /**
     * @param array<string, mixed> $cambio
     * @param array<string, mixed> $actor
     *
     * @return array<string, mixed>
     */
    public function actualizar(int $id, array $cambio, array $actor): array
    {
        $usuario = $this->usuarios->porId($id);
        if ($usuario === null) {
            throw new NoEncontradoException('Usuario no encontrado.');
        }

        $db = db_connect();
        $db->transStart();

        if (array_key_exists('rol', $cambio) && $cambio['rol'] !== $usuario['rol']) {
            $this->usuarios->update($id, ['rol' => $cambio['rol']]);
            $this->sincronizarGrupoShield((string) $usuario['email'], (string) $cambio['rol']);
            $this->auditoria->registrar($actor, 'usuario.rol', 'usuarios', $id, [
                'rol' => $usuario['rol'],
            ], [
                'rol' => $cambio['rol'],
            ]);
        }

        if (array_key_exists('activo', $cambio)) {
            $activo = filter_var($cambio['activo'], FILTER_VALIDATE_BOOL);
            if ($activo !== (bool) $usuario['activo']) {
                $this->usuarios->update($id, ['activo' => $activo ? 1 : 0]);
                $this->auditoria->registrar(
                    $actor,
                    $activo ? 'usuario.reactivado' : 'usuario.suspendido',
                    'usuarios',
                    $id,
                    ['activo' => (bool) $usuario['activo']],
                    ['activo' => $activo],
                );
            }
        }

        $db->transComplete();

        $fila = $this->usuarios->porId($id) ?? [];

        return [
            'id'     => (int) $fila['id'],
            'nombre' => (string) $fila['nombre'],
            'email'  => (string) $fila['email'],
            'rol'    => (string) $fila['rol'],
            'activo' => (bool) $fila['activo'],
        ];
    }

    /**
     * El grupo Shield espeja el rol de dominio (RF-USR-02).
     */
    private function sincronizarGrupoShield(string $email, string $rol): void
    {
        $proveedor = auth()->getProvider();
        $shield    = $proveedor->findByCredentials(['email' => $email]);
        if ($shield !== null) {
            $shield->syncGroups($rol);
        }
    }
}
