<?php

declare(strict_types=1);

namespace App\Libraries;

use CodeIgniter\HTTP\ResponseInterface;

/**
 * Formato de error estándar del contrato (doc 05 §1.4).
 */
final class RespuestasApi
{
    /**
     * @param array<string, list<string>>|null $fields
     */
    public static function error(
        int $status,
        string $codigo,
        string $mensaje,
        ?array $fields = null,
    ): ResponseInterface {
        $cuerpo = ['error' => $codigo, 'message' => $mensaje];
        if ($fields !== null) {
            $cuerpo['fields'] = $fields;
        }

        return service('response')->setStatusCode($status)->setJSON($cuerpo);
    }
}
