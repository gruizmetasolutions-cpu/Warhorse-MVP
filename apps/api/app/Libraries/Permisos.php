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
    public const MODULOS = ['dashboard', 'requisicion', 'taller', 'compras', 'catalogo', 'diesel', 'usuarios', 'reportes', 'reparaciones'];

    private const MATRIZ = [
        'admin'   => ['dashboard', 'requisicion', 'taller', 'compras', 'catalogo', 'diesel', 'usuarios', 'reportes', 'reparaciones'],
        'taller'  => ['requisicion', 'taller', 'catalogo', 'reparaciones'],
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
     * @param string[] $roles
     * @return array<string, bool>
     */
    public static function deRoles(array $roles): array
    {
        $permisos = [];
        foreach (self::MODULOS as $modulo) {
            $permisos[$modulo] = false;
        }

        foreach ($roles as $rol) {
            $visibles = self::MATRIZ[$rol] ?? [];
            foreach ($visibles as $modulo) {
                $permisos[$modulo] = true;
            }
        }

        return $permisos;
    }

    /**
     * @param string[] $roles
     */
    public static function landing(array $roles): string
    {
        if (in_array('admin', $roles, true)) return 'dashboard';
        if (in_array('compras', $roles, true)) return 'compras';
        if (in_array('taller', $roles, true)) return 'requisicion';
        if (in_array('diesel', $roles, true)) return 'diesel';
        
        return 'catalogo';
    }
}
