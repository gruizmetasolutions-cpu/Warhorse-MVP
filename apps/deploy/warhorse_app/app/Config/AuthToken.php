<?php

declare(strict_types=1);

namespace Config;

use CodeIgniter\Shield\Config\AuthToken as ShieldAuthToken;

/**
 * Tokens de acceso de vida corta (doc 04 §A02): una jornada operativa.
 */
class AuthToken extends ShieldAuthToken
{
    public int $unusedTokenLifetime = 12 * HOUR;

    public bool $recordActiveDate = true;
}
