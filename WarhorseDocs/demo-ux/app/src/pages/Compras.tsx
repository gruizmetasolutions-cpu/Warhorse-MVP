import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router'
import Badge from '../components/Badge'
import Boton from '../components/Boton'
import { CampoTexto } from '../components/Campo'
import Modal from '../components/Modal'
import Panel from '../components/Panel'
import Tabla from '../components/Tabla'
import { useToast } from '../components/Toast'
import * as api from '../lib/api'
import type { EstadoRequisicion, Requisicion, Unidad } from '../lib/types'

const dinero = (n: number) => '$' + n.toLocaleString('en-US')

const filtros: (EstadoRequisicion | 'Todos')[] = ['Todos', 'Solicitado', 'Cotizado', 'Comprado', 'Instalado']

type Accion =
  | { texto: 'Cotizar'; tipo: 'directa' }
  | { texto: 'Registrar compra'; tipo: 'comprar' }
  | { texto: 'Confirmar instalación'; tipo: 'instalar' }

const siguienteAccion = (r: Requisicion): Accion | null => {
  if (r.origen === 'Yonke') {
    return r.estado === 'Solicitado' ? { texto: 'Confirmar instalación', tipo: 'instalar' } : null
  }
  switch (r.estado) {
    case 'Solicitado':
      return { texto: 'Cotizar', tipo: 'directa' }
    case 'Cotizado':
      return { texto: 'Registrar compra', tipo: 'comprar' }
    case 'Comprado':
      return { texto: 'Confirmar instalación', tipo: 'instalar' }
    default:
      return null
  }
}

export default function Compras() {
  const { avisar } = useToast()
  const [cola, setCola] = useState<Requisicion[] | null>(null)
  const [unidades, setUnidades] = useState<Unidad[]>([])
  const [filtro, setFiltro] = useState<EstadoRequisicion | 'Todos'>('Todos')
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modal, setModal] = useState<{ req: Requisicion; tipo: 'comprar' | 'instalar' } | null>(null)
  const [costoReal, setCostoReal] = useState('')
  const [factura, setFactura] = useState('')
  const [errorModal, setErrorModal] = useState<string | null>(null)
  const [confirmando, setConfirmando] = useState(false)

  const cargar = useCallback(async (estado: EstadoRequisicion | 'Todos' = 'Todos') => {
    setCargando(true)
    setError(null)
    try {
      const [c, us] = await Promise.all([
        api.getColaCompras(estado === 'Todos' ? undefined : estado),
        api.getUnidades(),
      ])
      setCola(c)
      setUnidades(us)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudieron cargar los datos.')
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    void cargar()
  }, [cargar])

  const nombreUnidad = (id: number | null) => unidades.find((u) => u.id === id)?.id_unidad ?? '—'

  const cambiarFiltro = (f: EstadoRequisicion | 'Todos') => {
    setFiltro(f)
    void cargar(f)
  }

  const ejecutar = async (r: Requisicion, tipo: 'directa' | 'comprar' | 'instalar') => {
    if (tipo === 'directa') {
      try {
        await api.avanzarEstado(r.id, { estado: 'Cotizado' })
        avisar(`${r.descripcion_pieza}: pasó a Cotizado`)
        void cargar(filtro)
      } catch (e) {
        avisar(e instanceof Error ? e.message : 'No se pudo avanzar el estado.', 'error')
      }
      return
    }
    setModal({ req: r, tipo })
    setCostoReal('')
    setFactura('')
    setErrorModal(null)
  }

  const confirmarModal = async () => {
    if (!modal) return
    setConfirmando(true)
    setErrorModal(null)
    try {
      if (modal.tipo === 'comprar') {
        await api.avanzarEstado(modal.req.id, {
          estado: 'Comprado',
          costo_real: costoReal ? Number(costoReal) : undefined,
          numero_factura: factura || undefined,
        })
        avisar(`${modal.req.descripcion_pieza}: compra registrada`)
      } else {
        await api.avanzarEstado(modal.req.id, { estado: 'Instalado' })
        avisar(`${modal.req.descripcion_pieza}: instalada en ${nombreUnidad(modal.req.unidad_destino_id)}`)
      }
      setModal(null)
      void cargar(filtro)
    } catch (e) {
      setErrorModal(e instanceof Error ? e.message : 'No se pudo completar la acción.')
    } finally {
      setConfirmando(false)
    }
  }

  const costoDe = (r: Requisicion) => {
    if (r.costo_real !== null) return dinero(r.costo_real)
    if (r.es_estimado && r.costo_estimado !== null) return dinero(r.costo_estimado)
    return '$ por definir'
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-[34px] font-bold uppercase leading-none">
        Panel de compras
      </h1>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por estado" data-tour="filtros">
        {filtros.map((f) => (
          <button
            key={f}
            onClick={() => cambiarFiltro(f)}
            aria-pressed={filtro === f}
            className={`rounded-full border px-4 py-1.5 text-sm font-bold transition-colors focus:outline-none focus-visible:ring-4 focus-visible:ring-wh-orange-focus ${
              filtro === f
                ? 'border-wh-orange bg-wh-orange text-white'
                : 'border-wh-border bg-white text-wh-muted hover:text-wh-ink'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <Panel dataTour="cola">
        <Tabla
          etiqueta="Cola de compras ordenada por urgencia"
          columnas={[
            {
              titulo: 'Pieza',
              render: (r) => (
                <span>
                  <span className="block font-semibold">{r.descripcion_pieza}</span>
                  {r.numero_parte && <span className="block text-xs text-wh-muted">{r.numero_parte}</span>}
                </span>
              ),
            },
            {
              titulo: 'Destino',
              render: (r) => (
                <Link
                  to={`/ficha/${nombreUnidad(r.unidad_destino_id)}`}
                  className="font-display font-bold text-wh-orange-ink underline-offset-2 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-wh-orange-focus"
                >
                  {nombreUnidad(r.unidad_destino_id)}
                </Link>
              ),
            },
            {
              titulo: 'Origen',
              render: (r) => (
                <span data-tour={r.origen === 'Yonke' ? 'badge-origen' : undefined}>
                  <Badge tipo="origen" valor={r.origen} />
                  {r.origen === 'Yonke' && (
                    <span className="mt-1 block text-xs text-wh-muted">
                      donante {nombreUnidad(r.unidad_donante_id)}
                    </span>
                  )}
                </span>
              ),
            },
            { titulo: 'Urgencia', render: (r) => <Badge tipo="criticidad" valor={r.urgencia} /> },
            {
              titulo: 'Costo',
              alinear: 'right',
              render: (r) => (
                // RF-COM-04 / RF-INT-02: el costo Yonke se marca estimado, nunca facturado
                <span className="inline-flex items-center gap-2">
                  {r.es_estimado && <Badge tipo="origen" valor="Yonke" texto="Estimado" />}
                  {costoDe(r)}
                </span>
              ),
            },
            { titulo: 'Estado', render: (r) => <Badge tipo="estadoReq" valor={r.estado} /> },
            {
              titulo: 'Acción',
              render: (r) => {
                const accion = siguienteAccion(r)
                if (!accion) return <span className="text-xs text-wh-muted">—</span>
                return (
                  <Boton
                    variante={accion.tipo === 'directa' ? 'outline' : 'oscuro'}
                    className="!px-3 !py-2 text-xs"
                    onClick={() => void ejecutar(r, accion.tipo)}
                  >
                    {accion.texto}
                  </Boton>
                )
              },
            },
          ]}
          filas={cola}
          cargando={cargando}
          error={error}
          onReintentar={() => void cargar(filtro)}
          textoVacio="Sin requisiciones en esta vista"
          claveFila={(r) => r.id}
        />
      </Panel>

      <Modal
        abierto={modal !== null}
        titulo={modal?.tipo === 'comprar' ? 'Registrar compra' : 'Confirmar instalación'}
        onCerrar={() => setModal(null)}
        onConfirmar={() => void confirmarModal()}
        textoConfirmar={modal?.tipo === 'comprar' ? 'Registrar' : 'Confirmar'}
        confirmando={confirmando}
      >
        {modal?.tipo === 'comprar' ? (
          <div className="flex flex-col gap-4">
            <p className="text-sm">
              {modal.req.descripcion_pieza} para{' '}
              <strong>{nombreUnidad(modal.req.unidad_destino_id)}</strong>: captura el costo real y
              la factura para pasar a <Badge tipo="estadoReq" valor="Comprado" />.
            </p>
            <CampoTexto
              etiqueta="Costo real"
              type="number"
              min={1}
              value={costoReal}
              onChange={(e) => setCostoReal(e.target.value)}
            />
            <CampoTexto
              etiqueta="Número de factura"
              value={factura}
              onChange={(e) => setFactura(e.target.value)}
            />
          </div>
        ) : modal ? (
          <p className="text-sm leading-relaxed">
            La pieza <strong>{modal.req.descripcion_pieza}</strong>
            {modal.req.origen === 'Yonke' && <> (donante {nombreUnidad(modal.req.unidad_donante_id)})</>}{' '}
            se instalará en <strong>{nombreUnidad(modal.req.unidad_destino_id)}</strong> con costo{' '}
            {modal.req.es_estimado ? 'estimado ' : ''}
            <strong className="tabular-nums">{costoDe(modal.req)}</strong>. El costo sumará al
            consolidado del tracto destino.
          </p>
        ) : null}
        {errorModal && (
          <p className="mt-3 text-sm font-semibold text-wh-orange-ink" role="alert">
            {errorModal}
          </p>
        )}
      </Modal>
    </div>
  )
}
