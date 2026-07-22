<?php

declare(strict_types=1);

namespace App\Exceptions;

/**
 * Recurso inexistente (HTTP 404, doc 05 §1.3).
 */
final class NoEncontradoException extends \RuntimeException
{
}
