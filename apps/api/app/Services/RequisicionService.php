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
    ) {
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
}
