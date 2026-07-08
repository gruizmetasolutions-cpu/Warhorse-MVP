<?php

declare(strict_types=1);

namespace App\Models;

use CodeIgniter\Model;

/**
 * Cargas de diésel por unidad (doc 03).
 */
class RegistroDieselModel extends Model
{
    protected $table         = 'registros_diesel';
    protected $primaryKey    = 'id';
    protected $returnType    = 'array';
    protected $allowedFields = [
        'unidad_id', 'fecha', 'litros', 'costo_total', 'km_recorridos',
        'foto_ticket_url', 'capturado_por',
    ];
    protected $useTimestamps  = true;
    protected $updatedField   = '';

    /**
     * @return array<string, mixed>|null
     */
    public function porId(int $id): ?array
    {
        /** @var array<string, mixed>|null $fila */
        $fila = $this->find($id);

        return $fila;
    }
}
