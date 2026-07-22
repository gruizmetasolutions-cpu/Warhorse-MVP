<?php

declare(strict_types=1);

namespace App\Exceptions;

/**
 * Validación de negocio fallida (HTTP 422, doc 05 §1.4) con errores por campo.
 */
final class ValidacionException extends \RuntimeException
{
    /**
     * @param array<string, list<string>> $fields
     */
    public function __construct(string $mensaje, public readonly array $fields = [])
    {
        parent::__construct($mensaje);
    }
}
