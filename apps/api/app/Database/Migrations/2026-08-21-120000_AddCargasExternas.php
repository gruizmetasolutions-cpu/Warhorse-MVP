<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class AddCargasExternas extends Migration
{
    public function up()
    {
        $this->db->query(<<<'SQL'
        CREATE TABLE diesel_cargas_externas (
            id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            fecha           DATE            NOT NULL,
            litros_totales  DECIMAL(10,2)   NOT NULL,
            costo_total     DECIMAL(12,2)   NOT NULL,
            creado_por      BIGINT UNSIGNED NOT NULL,
            created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            CONSTRAINT fk_cargas_ext_usuario FOREIGN KEY (creado_por) REFERENCES usuarios(id) ON DELETE RESTRICT
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        SQL);

        $this->db->query(<<<'SQL'
        CREATE TABLE diesel_desgloses (
            id               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            carga_externa_id BIGINT UNSIGNED NOT NULL,
            unidad_id        BIGINT UNSIGNED NOT NULL,
            litros           DECIMAL(10,2)   NOT NULL,
            created_at       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            CONSTRAINT fk_desglose_carga FOREIGN KEY (carga_externa_id) REFERENCES diesel_cargas_externas(id) ON DELETE CASCADE,
            CONSTRAINT fk_desglose_unidad FOREIGN KEY (unidad_id) REFERENCES unidades(id) ON DELETE RESTRICT
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        SQL);
    }

    public function down()
    {
        $this->forge->dropTable('diesel_desgloses', true);
        $this->forge->dropTable('diesel_cargas_externas', true);
    }
}
