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
        $cuerpo = ['error' => $codigo, 'message' => $mensaje, 'real_status' => $status];
        if ($fields !== null) {
            $cuerpo['fields'] = $fields;
        }

        // Devolvemos SIEMPRE 200 para evadir el SPA intercept de Site5 (o hosting compartido)
        return service('response')->setStatusCode(200)->setJSON($cuerpo);
    }
}
