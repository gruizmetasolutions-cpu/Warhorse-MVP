<?php

declare(strict_types=1);

namespace App\Exceptions;

/**
 * Conflicto de estado o duplicado (HTTP 409, doc 05 §1.3).
 */
final class ConflictoException extends \RuntimeException
{
}
