<?php

declare(strict_types=1);

namespace App\Models;

use CodeIgniter\Model;

final class CatalogoPiezaModel extends Model
{
    protected $table            = 'catalogo_piezas';
    protected $primaryKey       = 'id';
    protected $useAutoIncrement = true;
    protected $returnType       = 'array';
    protected $allowedFields    = [
        'nombre_normalizado',
        'numero_parte',
        'precio_referencia',
        'stock_minimo',
        'stock_maximo',
    ];
    protected $useTimestamps    = true;
}
