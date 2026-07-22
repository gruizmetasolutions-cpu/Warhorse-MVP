<?php

declare(strict_types=1);

namespace App\Database\Seeds;

use CodeIgniter\Database\Seeder;

/**
 * Catálogo de piezas de referencia — alimenta el fallback C de la cascada
 * de valorización Yonke (ADR-002). Precios de referencia del demo.
 */
class CatalogoPiezasSeeder extends Seeder
{
    public function run(): void
    {
        $piezas = [
            ['nombre_normalizado' => 'Turbo', 'numero_parte' => 'TRB-3200', 'precio_referencia' => 4500.00],
            ['nombre_normalizado' => 'Balatas de freno', 'numero_parte' => 'BAL-4420', 'precio_referencia' => 1800.00],
            ['nombre_normalizado' => 'Caja de transmisión', 'numero_parte' => null, 'precio_referencia' => 28000.00],
            ['nombre_normalizado' => 'Kit de clutch', 'numero_parte' => 'CLT-1100', 'precio_referencia' => 6400.00],
            ['nombre_normalizado' => 'Chapa de puerta', 'numero_parte' => null, 'precio_referencia' => 800.00],
            ['nombre_normalizado' => 'Filtros de aceite', 'numero_parte' => 'FIL-0021', 'precio_referencia' => 950.00],
            ['nombre_normalizado' => 'Wiper completo', 'numero_parte' => null, 'precio_referencia' => 1200.00],
            ['nombre_normalizado' => 'Alternador', 'numero_parte' => 'ALT-7743', 'precio_referencia' => 3200.00],
        ];

        $this->db->table('catalogo_piezas')->insertBatch($piezas);
    }
}
