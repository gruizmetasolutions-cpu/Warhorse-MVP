<?php

declare(strict_types=1);

namespace App\Libraries;

/**
 * Actor de dominio autenticado del request en curso, resuelto por el filtro
 * `api-auth`. El rol SIEMPRE proviene de aquí (BD), nunca del payload.
 */
final class ActorActual
{
    /**
     * @var array<string, mixed>|null
     */
    private static ?array $usuario = null;

    /**
     * @param array<string, mixed> $usuario
     */
    public static function establecer(array $usuario): void
    {
        self::$usuario = $usuario;
    }

    /**
     * @return array<string, mixed>
     */
    public static function usuario(): array
    {
        if (self::$usuario === null) {
            throw new \RuntimeException('No hay actor autenticado; ¿falta el filtro api-auth en la ruta?');
        }

        return self::$usuario;
    }

    public static function rol(): string
    {
        return (string) self::usuario()['rol'];
    }

    /**
     * @return string[]
     */
    public static function roles(): array
    {
        $rolString = (string) self::usuario()['rol'];
        return array_filter(array_map('trim', explode(',', $rolString)));
    }

    public static function limpiar(): void
    {
        self::$usuario = null;
    }
}
