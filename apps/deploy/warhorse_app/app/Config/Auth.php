<?php

declare(strict_types=1);

namespace Config;

use CodeIgniter\Shield\Config\Auth as ShieldAuth;

/**
 * Shield para API pura (doc 04 §3.2): el SPA usa tokens de acceso
 * (`auth('tokens')`); no hay registro público ni vistas de auth.
 */
class Auth extends ShieldAuth
{
    public string $defaultAuthenticator = 'tokens';

    public bool $allowRegistration = false;

    /**
     * @var list<string>
     */
    public array $validFields = ['email'];
}
