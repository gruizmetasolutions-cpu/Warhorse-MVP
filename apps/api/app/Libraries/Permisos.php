<?php

declare(strict_types=1);

namespace App\Libraries;

/**
 * Matriz de módulos por rol (RF-USR-03) y aterrizaje por rol (RF-AUTH-02).
 * Extendida al SRS: incluye los módulos Taller y Diésel de la UI de
 * producción. El backend re-verifica cada acción con el filtro rbac;
 * esta matriz alimenta la visibilidad de navegación del SPA.
 */
final class Permisos
{
    public const MODULOS = ['dashboard', 'requisicion', 'taller', 'compras', 'catalogo', 'diesel', 'usuarios', 'reportes'];

    private const MATRIZ = [
        'admin'   => ['dashboard', 'requisicion', 'taller', 'compras', 'catalogo', 'diesel', 'usuarios', 'reportes'],
        'taller'  => ['requisicion', 'taller', 'catalogo'],
        'compras' => ['compras', 'catalogo', 'reportes'],
        'diesel'  => ['diesel', 'catalogo'],
    ];

    private const LANDING = [
        'admin'   => 'dashboard',
        'taller'  => 'requisicion',
        'compras' => 'compras',
        'diesel'  => 'diesel',
    ];

    /**
     * @return array<string, bool>
     */
    public static function deRol(string $rol): array
    {
        $visibles = self::MATRIZ[$rol] ?? [];
        $permisos = [];

        foreach (self::MODULOS as $modulo) {
            $permisos[$modulo] = in_array($modulo, $visibles, true);
        }

        return $permisos;
    }

    public static function landing(string $rol): string
    {
        return self::LANDING[$rol] ?? 'catalogo';
    }
}
