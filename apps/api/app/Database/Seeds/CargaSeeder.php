<?php

declare(strict_types=1);

namespace App\Database\Seeds;

use CodeIgniter\Database\Seeder;

/**
 * Escenario de carga del doc 06 §3: ~200 unidades, ~5.000 requisiciones/año,
 * cargas de diésel y taller proporcionales. Determinista (semilla fija) y
 * aditivo: se corre DESPUÉS de InitialSeeder, solo en la BD de pruebas.
 */
class CargaSeeder extends Seeder
{
    private const UNIDADES      = 200;
    private const REQUISICIONES = 5000;
    private const TALLER        = 1000;

    public function run(): void
    {
        mt_srand(20260708);

        $taller = $this->primerUsuario('taller');
        $diesel = $this->primerUsuario('diesel');

        // ---- unidades + consolidado ----
        $unidades = [];
        for ($i = 1; $i <= self::UNIDADES; $i++) {
            $tipo       = $i % 20 === 0 ? 'Caja' : 'Tractor';
            $estado     = $i % 25 === 0 ? 'Yonke' : 'Activo';
            $unidades[] = [
                'id_unidad'        => sprintf('WHP%03d', $i),
                'tipo'             => $tipo,
                'estado'           => $estado,
                'fecha_alta'       => sprintf('20%02d-%02d-01', mt_rand(15, 24), mt_rand(1, 12)),
                'valor_referencia' => $i % 10 === 0 ? null : mt_rand(200000, 800000),
            ];
        }
        $this->db->table('unidades')->insertBatch($unidades, true, 200);

        $ids = [];
        foreach ($this->filas("SELECT id, id_unidad, estado FROM unidades WHERE id_unidad LIKE 'WHP%'") as $u) {
            $ids[] = ['id' => (int) $u['id'], 'estado' => (string) $u['estado']];
        }

        $consolidado = [];
        foreach ($ids as $u) {
            $consolidado[] = [
                'unidad_id'         => $u['id'],
                'total_diesel'      => mt_rand(5000, 90000),
                'total_refacciones' => mt_rand(1000, 60000),
                'total_taller'      => mt_rand(500, 40000),
            ];
        }
        $this->db->table('consolidado_unidad')->insertBatch($consolidado, true, 200);

        // ---- ~5.000 requisiciones distribuidas en el año ----
        $estados   = ['Solicitado', 'Solicitado', 'Cotizado', 'Comprado', 'Instalado', 'Instalado'];
        $urgencias = ['Rápida', 'Media', 'Media', 'Crítica'];
        $lote      = [];
        for ($i = 1; $i <= self::REQUISICIONES; $i++) {
            $destino = $ids[mt_rand(0, count($ids) - 1)];
            $estado  = $estados[mt_rand(0, 5)];
            $lote[]  = [
                'unidad_destino_id' => $destino['id'],
                'origen'            => 'Compra',
                'descripcion_pieza' => 'Pieza de carga ' . $i,
                'foto_pieza_url'    => sprintf('carga/pieza-%04d.jpg', $i),
                'urgencia'          => $urgencias[mt_rand(0, 3)],
                'costo_estimado'    => mt_rand(100, 30000),
                'costo_real'        => in_array($estado, ['Comprado', 'Instalado'], true) ? mt_rand(100, 30000) : null,
                'numero_factura'    => in_array($estado, ['Comprado', 'Instalado'], true) ? sprintf('F-%05d', $i) : null,
                'estado'            => $estado,
                'fecha_solicitud'   => sprintf('2025-%02d-%02d', mt_rand(8, 12), mt_rand(1, 28)),
                'fecha_instalacion' => $estado === 'Instalado' ? sprintf('2026-%02d-%02d', mt_rand(1, 6), mt_rand(1, 28)) : null,
                'creado_por'        => $taller,
            ];
            if (count($lote) === 500) {
                $this->db->table('requisiciones')->insertBatch($lote, true, 500);
                $lote = [];
            }
        }
        if ($lote !== []) {
            $this->db->table('requisiciones')->insertBatch($lote, true, 500);
        }

        // ---- diésel: ~12 cargas por unidad activa del último año ----
        $lote = [];
        foreach ($ids as $u) {
            if ($u['estado'] !== 'Activo') {
                continue;
            }
            for ($m = 0; $m < 12; $m++) {
                $litros = mt_rand(150, 500);
                $lote[] = [
                    'unidad_id'     => $u['id'],
                    'fecha'         => date('Y-m-d', strtotime("2026-07-01 -{$m} month")),
                    'litros'        => $litros,
                    'costo_total'   => round($litros * 25.5, 2),
                    'km_recorridos' => (int) round($litros * (mt_rand(10, 30) / 10)),
                    'capturado_por' => $diesel,
                ];
            }
            if (count($lote) >= 500) {
                $this->db->table('registros_diesel')->insertBatch($lote, true, 500);
                $lote = [];
            }
        }
        if ($lote !== []) {
            $this->db->table('registros_diesel')->insertBatch($lote, true, 500);
        }

        // ---- taller: ~1.000 reparaciones, mitad liberadas ----
        $lote = [];
        for ($i = 1; $i <= self::TALLER; $i++) {
            $u        = $ids[mt_rand(0, count($ids) - 1)];
            $liberada = $i % 2 === 0;
            $parcial  = $liberada && $i % 4 === 0;
            $ingreso  = sprintf('2026-%02d-%02d', mt_rand(1, 6), mt_rand(1, 28));
            $lote[]   = [
                'unidad_id'       => $u['id'],
                'fecha_ingreso'   => $ingreso,
                'fecha_salida'    => $liberada ? date('Y-m-d', (int) strtotime($ingreso . ' +' . mt_rand(1, 20) . ' day')) : null,
                'diagnostico'     => 'Diagnóstico de carga ' . $i,
                'criticidad'      => ['Rápida', 'Media', 'Crítico'][mt_rand(0, 2)],
                'costo_taller'    => $liberada ? mt_rand(200, 25000) : 0,
                'tipo_liberacion' => $liberada ? ($parcial ? 'Parcial' : 'Total') : null,
                'pendientes'      => $parcial ? json_encode(['Pendiente de carga ' . $i], JSON_UNESCAPED_UNICODE) : null,
                'registrado_por'  => $taller,
            ];
            if (count($lote) === 500) {
                $this->db->table('registros_taller')->insertBatch($lote, true, 500);
                $lote = [];
            }
        }
        if ($lote !== []) {
            $this->db->table('registros_taller')->insertBatch($lote, true, 500);
        }

        // Tras la carga masiva, estadísticas frescas para el optimizador
        $this->db->query('ANALYZE TABLE unidades, consolidado_unidad, requisiciones, registros_diesel, registros_taller');
    }

    private function primerUsuario(string $rol): int
    {
        $filas = $this->filas("SELECT id FROM usuarios WHERE rol = '{$rol}' ORDER BY id LIMIT 1");
        if ($filas === []) {
            throw new \RuntimeException("No hay usuario con rol {$rol}: corre InitialSeeder primero.");
        }

        return (int) $filas[0]['id'];
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function filas(string $sql): array
    {
        $resultado = $this->db->query($sql);
        if (! $resultado instanceof \CodeIgniter\Database\ResultInterface) {
            throw new \RuntimeException('Consulta de seeder fallida.');
        }

        /** @var list<array<string, mixed>> */
        return array_values($resultado->getResultArray());
    }
}
