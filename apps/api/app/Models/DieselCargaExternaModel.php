<?php

namespace App\Models;

use CodeIgniter\Model;

class DieselCargaExternaModel extends Model
{
    protected $table            = 'diesel_cargas_externas';
    protected $primaryKey       = 'id';
    protected $useAutoIncrement = true;
    protected $returnType       = 'array';
    protected $useSoftDeletes   = false;
    protected $protectFields    = true;
    protected $allowedFields    = [
        'fecha',
        'litros_totales',
        'costo_total',
        'creado_por',
    ];

    protected $useTimestamps = true;
    protected $dateFormat    = 'datetime';
    protected $createdField  = 'created_at';
    protected $updatedField  = 'updated_at';

    /**
     * Obtiene las cargas externas con sus desgloses y nombres de unidades.
     */
    public function getCargasExternasConDesglose()
    {
        $cargas = $this->orderBy('fecha', 'DESC')->findAll();
        $desglosesModel = new DieselDesgloseModel();

        foreach ($cargas as &$carga) {
            $carga['desglose'] = $desglosesModel->getDesglosesPorCarga($carga['id']);
            // Format numbers so they are safe for JS
            $carga['litros_totales'] = (float)$carga['litros_totales'];
            $carga['costo_total'] = (float)$carga['costo_total'];
        }

        return $cargas;
    }
}
