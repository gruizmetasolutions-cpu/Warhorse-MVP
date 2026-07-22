<?php

declare(strict_types=1);

namespace App\Exceptions;

/**
 * Autenticado pero sin permiso sobre el recurso (HTTP 403, anti-IDOR doc 04 §A01).
 */
final class ProhibidoException extends \RuntimeException
{
}
