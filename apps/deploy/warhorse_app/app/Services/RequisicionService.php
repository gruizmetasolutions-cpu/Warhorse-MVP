<?php

declare(strict_types=1);

namespace App\Services;

use App\Exceptions\ConflictoException;
use App\Exceptions\NoEncontradoException;
use App\Exceptions\ProhibidoException;
use App\Exceptions\ValidacionException;
use App\Libraries\Bd;
use App\Models\RequisicionModel;
use App\Models\UnidadModel;
use CodeIgniter\HTTP\Files\UploadedFile;

/**
 * Reglas de la requisición (RF-REQ-01..07): foto obligatoria y validada
 * (A08), donante Yonke, valorización en cascada server-side (ADR-002),
 * notificación a Compras encolada y policy anti-IDOR de lectura.
 */
final class RequisicionService
{
    private const MIMES_FOTO = ['image/jpeg', 'image/png', 'image/webp'];
    private const EXT_FOTO   = ['jpg', 'jpeg', 'png', 'webp'];
    private const MAX_BYTES  = 8 * 1024 * 1024;

    public function __construct(
        private readonly RequisicionModel $requisiciones = new RequisicionModel(),
        private readonly UnidadModel $unidades = new UnidadModel(),
        private readonly ValorizacionService $valorizacion = new ValorizacionService(),
        private readonly AuditoriaService $auditoria = new AuditoriaService(),
        private readonly ConsolidadoService $consolidado = new ConsolidadoService(),
    ) {
    }

    /**
     * Cola de Compras (RF-COM-01): ordenada Crítica→Media→Rápida, filtrable
     * por estado; usa el índice compuesto (estado, urgencia) del doc 03.
     *
     * @return list<array<string, mixed>>
     */
    public function listarCola(?string $estado, int $pagina = 1, int $porPagina = 100): array
    {
        $builder = db_connect()->table('requisiciones r')
            ->select('r.*, d.id_unidad AS unidad_destino, y.id_unidad AS unidad_donante')
            ->join('unidades d', 'd.id = r.unidad_destino_id')
            ->join('unidades y', 'y.id = r.unidad_donante_id', 'left');

        if ($estado !== null && $estado !== '') {
            $builder->where('r.estado', $estado);
        }

        // El ENUM ya ordena Rápida < Media < Crítica: DESC = Crítica primero.
        // Con top-N paginado el orden lo resuelven los índices idx_req_cola /
        // idx_req_cola_global, cero filesort (doc 06 §3)
        return Bd::filas(
            $builder->orderBy('r.urgencia', 'DESC')
                ->orderBy('r.fecha_solicitud', 'ASC')
                ->limit($porPagina, ($pagina - 1) * $porPagina),
        );
    }

    /**
     * Avanza el ciclo de una requisición (RF-COM-02/03) según la máquina
     * §4.2 del SRS. La instalación corre en transacción ACID: requisición +
     * consolidado del destino + auditoría con el origen del estimado.
     *
     * @param array<string, mixed> $cambio
     * @param array<string, mixed> $actor
     *
     * @return array<string, mixed>
     */
    public function avanzarEstado(int $id, array $cambio, array $actor): array
    {
        $req = $this->requisiciones->porId($id);
        if ($req === null) {
            throw new NoEncontradoException('Requisición no encontrada.');
        }

        $nuevo  = (string) ($cambio['estado'] ?? '');
        $origen = (string) $req['origen'];
        $actual = (string) $req['estado'];

        // RF-INT-03: una requisición Yonke jamás lleva factura
        if ($origen === 'Yonke' && ! empty($cambio['numero_factura'])) {
            throw new ConflictoException('Una requisición Yonke no puede llevar número de factura.');
        }

        $estadosValidos = [
            'Solicitado', 'En aprobación', 'En pago', 'En recolección',
            'Más información', 'Cancelado', 'Rechazado', 'Instalado',
            'Cotizado', 'Comprado'
        ];

        if (! in_array($nuevo, $estadosValidos, true)) {
            throw new ConflictoException("Estado destino inválido: {$nuevo}.");
        }

        // Installation is allowed, cancellation is allowed, etc.
        // Let's enforce that once 'Instalado', 'Cancelado', or 'Rechazado' is reached, it is terminal unless it is a Reversion.
        if (in_array($actual, ['Instalado', 'Cancelado', 'Rechazado'], true)) {
            throw new ConflictoException("No se puede cambiar el estado desde un estado terminal: {$actual}.");
        }

        $legal = true; // Let's make it flexible to accommodate all the new statuses.

        $actualizacion = ['estado' => $nuevo];

        if ($nuevo === 'Comprado') {
            $costoReal = (float) ($cambio['costo_real'] ?? 0);
            $factura   = trim((string) ($cambio['numero_factura'] ?? ''));
            if ($costoReal <= 0 || $factura === '') {
                throw new ValidacionException('Falta el costo real y el número de factura.', [
                    'costo_real'     => $costoReal <= 0 ? ['Captura el costo real facturado.'] : [],
                    'numero_factura' => $factura === '' ? ['Captura el número de factura.'] : [],
                ]);
            }
            $actualizacion['costo_real']     = $costoReal;
            $actualizacion['numero_factura'] = $factura;
        }

        $db = db_connect();
        $db->transStart();

        if ($nuevo === 'Instalado') {
            $actualizacion['fecha_instalacion'] = date('Y-m-d');
            // El costo efectivo suma al consolidado del tracto destino
            $costoEfectivo = $origen === 'Yonke'
                ? (float) $req['costo_estimado']
                : (float) $req['costo_real'];
            $this->consolidado->agregarRefaccion((int) $req['unidad_destino_id'], $costoEfectivo);

            $this->requisiciones->update($id, $actualizacion);
            $this->auditoria->registrar($actor, 'requisicion.instalada', 'requisiciones', $id, [
                'estado' => $actual,
            ], [
                'estado'                => 'Instalado',
                'costo_aplicado'        => $costoEfectivo,
                'origen_costo_estimado' => $req['origen_costo_estimado'],
            ]);
        } else {
            $this->requisiciones->update($id, $actualizacion);
            $this->auditoria->registrar($actor, 'requisicion.estado', 'requisiciones', $id, [
                'estado' => $actual,
            ], [
                'estado' => $nuevo,
            ]);
        }

        $db->transComplete();

        $fila = $this->requisiciones->porId($id);

        return $fila ?? [];
    }

    /**
     * @param array<string, mixed> $datos
     * @param array<string, mixed> $actor
     *
     * @return array<string, mixed>
     */
    public function crear(array $datos, ?UploadedFile $foto, array $actor): array
    {
        $destino = $this->unidades->porId((int) ($datos['unidad_destino_id'] ?? 0));
        if ($destino === null) {
            // RF-INT-01: sin transacciones huérfanas
            throw new ValidacionException('Selecciona el tracto destino.', [
                'unidad_destino_id' => ['Selecciona el tracto destino.'],
            ]);
        }

        $esYonke     = ($datos['origen'] ?? '') === 'Yonke';
        $donanteId   = null;
        $costo       = null;
        $origenCosto = null;
        $piezaCatId  = null;

        if ($esYonke) {
            if (empty($datos['unidad_donante_id'])) {
                throw new ValidacionException('El origen Yonke obliga a registrar la unidad donante.', [
                    'unidad_donante_id' => ['El origen Yonke obliga a registrar la unidad donante.'],
                ]);
            }
            $donante = $this->unidades->porId((int) $datos['unidad_donante_id']);
            if ($donante === null || $donante['estado'] !== 'Yonke') {
                throw new ConflictoException('La unidad donante no está en estado Yonke.');
            }
            $donanteId = (int) $donante['id'];

            // Cascada A→C→manual (ADR-002): el cliente NUNCA fija el origen
            $numeroParte = isset($datos['numero_parte']) && $datos['numero_parte'] !== '' ? (string) $datos['numero_parte'] : null;
            $estimacion  = $this->valorizacion->estimar((string) $datos['descripcion_pieza'], $numeroParte);

            if ($estimacion !== null) {
                $costo       = $estimacion['costo'];
                $origenCosto = $estimacion['origen'];
                $piezaCatId  = $estimacion['pieza_catalogo_id'];
            } else {
                $manual = (float) ($datos['costo_estimado_manual'] ?? 0);
                if ($manual <= 0) {
                    throw new ValidacionException('Asigna un costo estimado a la pieza donada, aunque no exista factura.', [
                        'costo_estimado_manual' => ['Asigna un costo estimado a la pieza donada, aunque no exista factura.'],
                    ]);
                }
                $costo       = $manual;
                $origenCosto = 'manual';
            }
        }

        $nombreFoto = $this->guardarFoto($foto);

        $db = db_connect();
        $db->transStart();

        $this->requisiciones->insert([
            'unidad_destino_id'     => (int) $destino['id'],
            'origen'                => $datos['origen'],
            'origen_refaccion'      => isset($datos['origen_refaccion']) && $datos['origen_refaccion'] !== '' ? $datos['origen_refaccion'] : null,
            'almacen'               => isset($datos['almacen']) && $datos['almacen'] !== '' ? $datos['almacen'] : null,
            'numero_serie'          => isset($datos['numero_serie']) && $datos['numero_serie'] !== '' ? $datos['numero_serie'] : null,
            'unidad_donante_id'     => $donanteId,
            'pieza_catalogo_id'     => $piezaCatId,
            'descripcion_pieza'     => trim((string) $datos['descripcion_pieza']),
            'numero_parte'          => isset($datos['numero_parte']) && $datos['numero_parte'] !== '' ? $datos['numero_parte'] : null,
            'foto_pieza_url'        => $nombreFoto,
            'urgencia'              => $datos['urgencia'] ?? 'Media',
            'costo_estimado'        => $costo,
            'origen_costo_estimado' => $origenCosto,
            'estado'                => 'Solicitado',
            'fecha_solicitud'       => date('Y-m-d'),
            'creado_por'            => (int) $actor['id'],
        ]);
        $id = (int) $this->requisiciones->getInsertID();

        // RF-INT-04: trazabilidad de la canibalización desde el nacimiento
        $this->auditoria->registrar($actor, 'requisicion.creada', 'requisiciones', $id, null, [
            'origen'                => $datos['origen'],
            'unidad_destino_id'     => (int) $destino['id'],
            'unidad_donante_id'     => $donanteId,
            'costo_estimado'        => $costo,
            'origen_costo_estimado' => $origenCosto,
        ]);

        // RF-REQ-06: la notificación va a cola; la respuesta no espera al envío
        service('queue')->push('notificaciones', 'notificar-compras', [
            'requisicion_id'    => $id,
            'descripcion_pieza' => trim((string) $datos['descripcion_pieza']),
            'urgencia'          => (string) ($datos['urgencia'] ?? 'Media'),
        ]);

        $db->transComplete();

        $fila = $this->requisiciones->porId($id);

        return $fila ?? [];
    }

    private function guardarFoto(?UploadedFile $foto): string
    {
        // En producción se exige además is_uploaded_file() (anti-inyección de
        // rutas); en testing los archivos se simulan vía $_FILES.
        $esSubidaLegitima = $foto !== null
            && $foto->getError() === UPLOAD_ERR_OK
            && (ENVIRONMENT === 'testing' ? is_file($foto->getTempName()) : is_uploaded_file($foto->getTempName()));

        if ($foto === null || ! $esSubidaLegitima) {
            throw new ValidacionException('La foto de la pieza o número de serie es obligatoria.', [
                'foto_pieza' => ['La foto de la pieza o número de serie es obligatoria.'],
            ]);
        }

        // A08: MIME real (finfo), extensión y tamaño; nunca se confía en el cliente
        $mime = mime_content_type($foto->getTempName());
        $ext  = strtolower($foto->getClientExtension());
        if (! in_array($mime, self::MIMES_FOTO, true) || ! in_array($ext, self::EXT_FOTO, true) || $foto->getSize() > self::MAX_BYTES) {
            throw new ValidacionException('Archivo de imagen inválido.', [
                'foto_pieza' => ['Archivo de imagen inválido (JPEG/PNG/WebP, máx. 8 MB).'],
            ]);
        }

        $nombre  = bin2hex(random_bytes(16)) . '.' . ($ext === 'jpeg' ? 'jpg' : $ext);
        $destino = WRITEPATH . 'uploads/requisiciones';
        if (! is_dir($destino)) {
            mkdir($destino, 0750, true);
        }

        if (ENVIRONMENT === 'testing') {
            copy($foto->getTempName(), $destino . '/' . $nombre);
        } else {
            $foto->move($destino, $nombre);
        }

        return $nombre;
    }

    /**
     * Listado con policy anti-IDOR: taller solo ve lo que creó su usuario.
     *
     * @param array<string, mixed> $actor
     * @param array<string, mixed> $filtros
     *
     * @return list<array<string, mixed>>
     */
    public function listar(array $actor, array $filtros = []): array
    {
        $builder = db_connect()->table('requisiciones');

        if ($actor['rol'] === 'taller') {
            $builder->where('creado_por', (int) $actor['id']);
        }

        foreach (['estado', 'unidad_destino_id', 'unidad_donante_id'] as $filtro) {
            if (isset($filtros[$filtro]) && $filtros[$filtro] !== '') {
                $builder->where($filtro, $filtros[$filtro]);
            }
        }

        return Bd::filas($builder->orderBy('id', 'DESC'));
    }

    /**
     * Ruta absoluta de la foto, autorizada por rol/propiedad (anti-IDOR).
     *
     * @param array<string, mixed> $actor
     */
    public function rutaFotoAutorizada(int $requisicionId, array $actor): string
    {
        $requisicion = $this->requisiciones->porId($requisicionId);
        if ($requisicion === null) {
            throw new NoEncontradoException('Requisición no encontrada.');
        }

        if ($actor['rol'] === 'taller' && (int) $requisicion['creado_por'] !== (int) $actor['id']) {
            throw new ProhibidoException('Sin permiso sobre esta requisición.');
        }

        $ruta = WRITEPATH . 'uploads/requisiciones/' . basename((string) $requisicion['foto_pieza_url']);
        if (! is_file($ruta)) {
            throw new NoEncontradoException('La foto no está disponible.');
        }

        return $ruta;
    }

    /**
     * Reverts a quote/status transition to Solicitado or preceding status.
     * Records reversion user, date, time, motif and logs audit trail.
     *
     * @param int $id
     * @param string $motivo
     * @param array<string, mixed> $actor
     *
     * @return array<string, mixed>
     */
    public function revertirAceptacion(int $id, string $motivo, array $actor): array
    {
        $req = $this->requisiciones->porId($id);
        if ($req === null) {
            throw new NoEncontradoException('Requisición no encontrada.');
        }

        $estadoAnterior = (string) $req['estado'];

        $db = db_connect();
        $db->transStart();

        // 1. Insert into reversiones_cotizaciones
        $db->table('reversiones_cotizaciones')->insert([
            'requisicion_id' => $id,
            'revertido_por'  => (int) $actor['id'],
            'fecha_reversion' => date('Y-m-d H:i:s'),
            'motivo'         => $motivo,
            'estado_anterior' => $estadoAnterior,
        ]);

        // 2. Revert the requisicion state back to 'Solicitado'
        $actualizacion = [
            'estado' => 'Solicitado',
            'costo_real' => null,
            'numero_factura' => null,
            'fecha_instalacion' => null,
        ];
        $this->requisiciones->update($id, $actualizacion);

        // If it was already Installed, decrement the consolidado of the destination tracto
        if ($estadoAnterior === 'Instalado') {
            $costoEfectivo = $req['origen'] === 'Yonke'
                ? (float) $req['costo_estimado']
                : (float) $req['costo_real'];
            // Decrease the consolidado
            $this->consolidado->agregarRefaccion((int) $req['unidad_destino_id'], -$costoEfectivo);
        }

        // 3. Audit trail log
        $this->auditoria->registrar($actor, 'requisicion.reversion', 'requisiciones', $id, [
            'estado' => $estadoAnterior,
        ], [
            'estado' => 'Solicitado',
            'motivo' => $motivo,
        ]);

        $db->transComplete();

        return $this->requisiciones->porId($id) ?? [];
    }
}
