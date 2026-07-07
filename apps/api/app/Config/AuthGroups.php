<?php

declare(strict_types=1);

namespace Config;

use CodeIgniter\Shield\Config\AuthGroups as ShieldAuthGroups;

/**
 * Grupos de Shield = roles del sistema (SRS §2.2). La matriz de módulos por
 * rol (RF-USR-03) vive en App\Libraries\Permisos; aquí solo los grupos.
 */
class AuthGroups extends ShieldAuthGroups
{
    public string $defaultGroup = 'taller';

    /**
     * @var array<string, array<string, string>>
     */
    public array $groups = [
        'admin' => [
            'title'       => 'Dirección (Admin)',
            'description' => 'Tablero directivo, catálogos maestros, usuarios y parámetros del veredicto.',
        ],
        'taller' => [
            'title'       => 'Taller',
            'description' => 'Requisiciones, registro de yonke e ingresos/liberaciones de taller.',
        ],
        'compras' => [
            'title'       => 'Compras',
            'description' => 'Gestión del ciclo de compra y costos reales.',
        ],
        'diesel' => [
            'title'       => 'Control de Diésel',
            'description' => 'Captura de cargas de combustible por unidad.',
        ],
    ];

    /**
     * @var array<string, array<string, string>>
     */
    public array $permissions = [];

    /**
     * @var array<string, list<string>>
     */
    public array $matrix = [];
}
