<?php

declare(strict_types=1);

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

/**
 * Doc 06 §3: la cola de Compras debe resolverse por índice, cero filesort.
 * Extiende el índice (estado, urgencia) del doc 03 con la dirección real de
 * lectura: estado fijo, urgencia DESC (ENUM: Crítica primero) y antigüedad
 * ASC. MariaDB 11.8 soporta columnas DESC en índices.
 */
class IndiceColaCompras extends Migration
{
    public function up(): void
    {
        $this->db->query('ALTER TABLE requisiciones DROP INDEX idx_req_estado_urgencia');
        $this->db->query('CREATE INDEX idx_req_cola ON requisiciones (estado, urgencia DESC, fecha_solicitud)');
        // La cola sin filtro de estado (top-N paginado) ordena por este índice
        $this->db->query('CREATE INDEX idx_req_cola_global ON requisiciones (urgencia DESC, fecha_solicitud)');
    }

    public function down(): void
    {
        $this->db->query('ALTER TABLE requisiciones DROP INDEX idx_req_cola_global');
        $this->db->query('ALTER TABLE requisiciones DROP INDEX idx_req_cola');
        $this->db->query('CREATE INDEX idx_req_estado_urgencia ON requisiciones (estado, urgencia)');
    }
}
