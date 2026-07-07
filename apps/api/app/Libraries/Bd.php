<?php

declare(strict_types=1);

namespace App\Libraries;

use CodeIgniter\Database\BaseBuilder;
use CodeIgniter\Database\ResultInterface;

/**
 * Helpers de lectura del Query Builder con tipos estrictos (PHPStan 8):
 * `get()` declara `ResultInterface|false` y aquí se normaliza.
 */
final class Bd
{
    /**
     * @return list<array<string, mixed>>
     */
    public static function filas(BaseBuilder $builder): array
    {
        $resultado = $builder->get();
        if (! $resultado instanceof ResultInterface) {
            throw new \RuntimeException('Fallo al leer de la base de datos.');
        }

        /** @var list<array<string, mixed>> */
        return array_values($resultado->getResultArray());
    }

    /**
     * @return array<string, mixed>|null
     */
    public static function fila(BaseBuilder $builder): ?array
    {
        $resultado = $builder->get();
        if (! $resultado instanceof ResultInterface) {
            throw new \RuntimeException('Fallo al leer de la base de datos.');
        }

        $fila = $resultado->getRowArray();

        return is_array($fila) ? $fila : null;
    }
}
