import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router'
import { 
  Wrench, 
  Truck, 
  AlertTriangle, 
  Plus, 
  Trash2, 
  ArrowLeft, 
  Send, 
  Sparkles, 
  Package,
  ShieldAlert
} from 'lucide-react'
import { 
  getUnidades, 
  getResponsablesTaller, 
  crearOrdenTrabajo, 
  registrarIngreso,
  type UnidadApi, 
  type ResponsableTaller 
} from '../../lib/api'
import { useUiStore } from '../../store/useUiStore'
import { OrdenTrabajoModal, type DetalleOT } from '../../components/taller/OrdenTrabajoModal'
import { obtenerHistorialLocal, marcarInspeccionAtendida } from '../../lib/inspeccionStorage'

interface StatePreCargaOT {
  unidadId?: number
  id_unidad?: string
  criticidad?: 'Rápida' | 'Media' | 'Crítico'
  diagnostico?: string
  folioInspeccion?: string
}

export const TallerNuevaOT: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const stateOrigen = location.state as StatePreCargaOT | undefined

  const { agregarToast } = useUiStore()

  const [tipoOT, setTipoOT] = useState<'Correctivo' | 'Preventivo'>('Correctivo')
  const [unidades, setUnidades] = useState<UnidadApi[]>([])
  const [responsables, setResponsables] = useState<ResponsableTaller[]>([])
  const [unidadId, setUnidadId] = useState<number>(1)
  const [responsableId, setResponsableId] = useState<number>(1)
  const [criticidad, setCriticidad] = useState<'Rápida' | 'Media' | 'Crítico'>('Media')
  const [diagnostico, setDiagnostico] = useState('')
  const [materiales, setMateriales] = useState<Array<{ pieza: string; cantidad: number }>>([])
  const [nuevaPieza, setNuevaPieza] = useState('')
  const [nuevaCantidad, setNuevaCantidad] = useState(1)
  const [cargando, setCargando] = useState(false)
  const [alertasPatio, setAlertasPatio] = useState<Array<{ folio: string; unidad: string; falla: string }>>([])
  const [folioInspeccionOrigen, setFolioInspeccionOrigen] = useState<string | null>(null)

  const [otEmitida, setOtEmitida] = useState<DetalleOT | null>(null)
  const [modalAbierto, setModalAbierto] = useState(false)

  useEffect(() => {
    async function cargarCatalogos() {
      const fallbackUnidades: UnidadApi[] = [
        { id: 1, id_unidad: 'WH-101', tipo: 'Tractor', estado: 'Activo', valor_referencia: 850000, costo_real_acumulado: 0, candidata_reincidencia: false },
        { id: 2, id_unidad: 'WH-104', tipo: 'Tractor', estado: 'Activo', valor_referencia: 920000, costo_real_acumulado: 0, candidata_reincidencia: false },
        { id: 3, id_unidad: 'WH-125', tipo: 'Tractor', estado: 'Activo', valor_referencia: 780000, costo_real_acumulado: 0, candidata_reincidencia: false },
        { id: 4, id_unidad: 'CJ-502', tipo: 'Caja', estado: 'Activo', valor_referencia: 320000, costo_real_acumulado: 0, candidata_reincidencia: false },
        { id: 5, id_unidad: 'TH-201', tipo: 'Thermo', estado: 'Activo', valor_referencia: 450000, costo_real_acumulado: 0, candidata_reincidencia: false },
      ]

      try {
        const [listaUnidades, listaResp] = await Promise.all([
          getUnidades().catch(() => fallbackUnidades),
          getResponsablesTaller().catch(() => [
            { id: 1, nombre: 'Carlos Méndez', tipo: 'Tracto' as const, rol: 'Mecánico A' as const },
            { id: 2, nombre: 'Luis Morales', tipo: 'Tracto' as const, rol: 'Mecánico B' as const },
            { id: 3, nombre: 'Héctor Gómez', tipo: 'Caja' as const, rol: 'Auxiliar' as const },
          ]),
        ])
        const finalUnidades = listaUnidades && listaUnidades.length > 0 ? listaUnidades : fallbackUnidades
        setUnidades(finalUnidades)

        // Precarga de State si se invocó desde la bandeja de alertas de patio
        if (stateOrigen) {
          if (stateOrigen.folioInspeccion) {
            setFolioInspeccionOrigen(stateOrigen.folioInspeccion)
          }
          if (stateOrigen.criticidad) {
            setCriticidad(stateOrigen.criticidad)
          }
          if (stateOrigen.diagnostico) {
            setDiagnostico(stateOrigen.diagnostico)
          }
          setTipoOT('Correctivo')

          let matchedUnidad = finalUnidades.find(u => u.id === stateOrigen.unidadId)
          if (!matchedUnidad && stateOrigen.id_unidad) {
            matchedUnidad = finalUnidades.find(u => u.id_unidad.toLowerCase() === stateOrigen.id_unidad?.toLowerCase())
          }
          if (matchedUnidad) {
            setUnidadId(matchedUnidad.id)
          } else if (finalUnidades.length > 0) {
            setUnidadId(finalUnidades[0].id)
          }
        } else {
          if (finalUnidades.length > 0) setUnidadId(finalUnidades[0].id)
        }

        setResponsables(listaResp)
        if (listaResp.length > 0) setResponsableId(listaResp[0].id)

        // Buscar alertas recientes en el almacenamiento de patio
        const historialPatio = await obtenerHistorialLocal()
        const fallasEncontradas: Array<{ folio: string; unidad: string; falla: string }> = []
        historialPatio.forEach(h => {
          // Solo mostrar alertas que no hayan sido atendidas aún
          if (!h.ot_generada) {
            h.items.forEach(item => {
              if (item.estado !== 'Bueno') {
                fallasEncontradas.push({
                  folio: h.folio,
                  unidad: h.unidad_id,
                  falla: `${item.componente}: ${item.observacion || 'Falla reportada en patio'}`,
                })
              }
            })
          }
        })
        setAlertasPatio(fallasEncontradas)
      } catch (err) {
        console.error('Error al cargar catálogos de taller', err)
      }
    }
    cargarCatalogos()
  }, [])

  const precargarAlertaPatio = (alerta: { folio: string; unidad: string; falla: string }) => {
    const uni = unidades.find(u => u.id_unidad === alerta.unidad)
    if (uni) setUnidadId(uni.id)
    setTipoOT('Correctivo')
    setCriticidad('Media')
    setFolioInspeccionOrigen(alerta.folio)
    setDiagnostico(`[Derivado de Inspección ${alerta.folio}]: ${alerta.falla}`)
    agregarToast({
      tipo: 'info',
      titulo: 'Alerta Precargada',
      mensaje: `Se vincularon los datos de la falla de patio para la unidad ${alerta.unidad}.`,
    })
  }

  const agregarMaterial = () => {
    if (!nuevaPieza.trim()) return
    setMateriales([...materiales, { pieza: nuevaPieza.trim(), cantidad: Number(nuevaCantidad) || 1 }])
    setNuevaPieza('')
    setNuevaCantidad(1)
  }

  const removerMaterial = (idx: number) => {
    setMateriales(materiales.filter((_, i) => i !== idx))
  }

  const manejarEnvio = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!diagnostico.trim()) {
      agregarToast({
        tipo: 'error',
        titulo: 'Datos Incompletos',
        mensaje: 'Debes proporcionar un diagnóstico mecánico detallado.',
      })
      return
    }

    setCargando(true)
    try {
      // 1. Crear Orden de Trabajo oficial en el backend
      const respOT = await crearOrdenTrabajo({
        unidad_id: unidadId,
        responsable_id: responsableId,
        categoria: tipoOT,
        diagnostico,
        materiales,
      })

      // 2. Registrar Ingreso a Taller para sincronizar con la máquina de estados
      await registrarIngreso({
        unidad_id: unidadId,
        fecha_ingreso: new Date().toISOString().substring(0, 10),
        diagnostico,
        criticidad,
      }).catch(() => {
        // Fallback si ya tiene un ingreso abierto
      })

      const unidadSeleccionada = unidades.find(u => u.id === unidadId)
      const responsableSeleccionado = responsables.find(r => r.id === responsableId)
      const folioGenerado = respOT.folio || `OT-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`

      // 3. Si la OT proviene de una inspección física de patio, vincularla automáticamente
      if (folioInspeccionOrigen) {
        await marcarInspeccionAtendida(folioInspeccionOrigen, folioGenerado).catch(() => {})
      }

      const detalleEmitido: DetalleOT = {
        id: respOT.id || Date.now(),
        folio: folioGenerado,
        tipo: tipoOT,
        estado: 'Activa',
        unidad_id: unidadSeleccionada?.id_unidad || 'WH-101',
        tipo_unidad: unidadSeleccionada?.tipo || 'Tractor',
        responsable_nombre: responsableSeleccionado?.nombre || 'Carlos Méndez',
        responsable_rol: responsableSeleccionado?.rol || 'Mecánico A',
        diagnostico,
        criticidad,
        fecha_ingreso: new Date().toISOString().substring(0, 10),
        costo_taller: 0,
        materiales,
      }

      setOtEmitida(detalleEmitido)
      setModalAbierto(true)

      agregarToast({
        tipo: 'success',
        titulo: 'OT Generada',
        mensaje: `Se emitió la Orden de Trabajo ${folioGenerado}. La unidad pasa a estatus Inactivo en Reparación.`,
      })
    } catch (err: unknown) {
      agregarToast({
        tipo: 'error',
        titulo: 'Error al Crear OT',
        mensaje: err instanceof Error ? err.message : 'Error al conectar con la API de taller.',
      })
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-[rgba(243,239,231,0.1)] pb-5">
        <div>
          <button
            type="button"
            onClick={() => navigate('/taller/ordenes')}
            className="inline-flex items-center gap-1.5 text-xs text-[#B8B2A6] hover:text-white mb-2 transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Volver a la Cola de OTs</span>
          </button>
          <div className="flex items-center gap-2">
            <span className="rounded bg-[#F2620F]/20 px-2 py-0.5 font-['Barlow_Condensed'] text-xs font-bold uppercase tracking-wider text-[#F2620F]">
              Módulo Taller
            </span>
            <span className="rounded bg-[#C5A059]/20 px-2 py-0.5 font-['Barlow_Condensed'] text-xs font-bold uppercase tracking-wider text-[#C5A059]">
              Apertura de Mantenimiento
            </span>
          </div>
          <h1 className="mt-1 font-['Barlow_Condensed'] text-3xl font-extrabold uppercase tracking-wide text-white sm:text-4xl">
            Nueva Orden de Trabajo (OT)
          </h1>
          <p className="text-xs text-[#B8B2A6]">
            Habilita intervenciones mecánicas y desbloquea el flujo de requisiciones en compras.
          </p>
        </div>
      </div>

      {/* Banner de Inspección de Patio Vinculada */}
      {folioInspeccionOrigen && (
        <div className="rounded-2xl border border-[#F2620F]/50 bg-[#F2620F]/10 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F2620F]/20 text-[#F2620F] shrink-0">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <div className="font-['Barlow_Condensed'] text-sm font-bold uppercase tracking-wider text-white">
                OT Correctiva Derivada de Inspección en Patio
              </div>
              <p className="text-xs text-[#B8B2A6]">
                Folio de inspección origen: <span className="font-mono text-[#F2620F] font-bold">{folioInspeccionOrigen}</span>. Al guardar esta OT, la inspección quedará formalmente atendida.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setFolioInspeccionOrigen(null)}
            className="text-xs text-[#B8B2A6] hover:text-white underline cursor-pointer self-start sm:self-auto"
          >
            Desvincular Folio
          </button>
        </div>
      )}

      {/* Alertas de Inspecciones de Patio Recientes (Precarga 1-Click) */}
      {!folioInspeccionOrigen && alertasPatio.length > 0 && (
        <div className="rounded-2xl border border-[#F2620F]/30 bg-[#B4430A]/10 p-5 space-y-3">
          <div className="flex items-center gap-2 text-[#F2620F]">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <h4 className="font-['Barlow_Condensed'] text-sm font-bold uppercase tracking-wider">
              Alertas Recientes de Patio Detectadas ({alertasPatio.length})
            </h4>
          </div>
          <p className="text-xs text-[#B8B2A6]">
            Se detectaron unidades que salieron de inspección con fallas reportadas. Puedes precargar la OT con 1 clic:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            {alertasPatio.map((alerta, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between rounded-xl border border-[rgba(243,239,231,0.1)] bg-[#14181D] p-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-1.5 font-['Barlow_Condensed'] font-bold text-white">
                    <Truck className="h-3.5 w-3.5 text-[#F2620F]" />
                    <span>{alerta.unidad}</span>
                    <span className="text-[10px] text-[#C5A059]">({alerta.folio})</span>
                  </div>
                  <div className="text-[11px] text-[#B8B2A6] mt-0.5 line-clamp-1">{alerta.falla}</div>
                </div>
                <button
                  type="button"
                  onClick={() => precargarAlertaPatio(alerta)}
                  className="rounded-lg bg-[#F2620F] px-2.5 py-1 font-['Barlow_Condensed'] text-[11px] font-bold uppercase text-[#16191E] hover:bg-[#D9550C] transition-all cursor-pointer shrink-0 ml-2"
                >
                  Cargar OT
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Formulario Principal */}
      <form onSubmit={manejarEnvio} className="rounded-2xl border border-[rgba(243,239,231,0.1)] bg-[#14181D]/80 p-6 sm:p-8 space-y-6">
        {/* Selector de Tipo de OT */}
        <div>
          <label className="mb-2 block text-xs font-semibold text-[#B8B2A6]">
            Tipo de Orden de Trabajo
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setTipoOT('Correctivo')}
              className={`flex items-start gap-3 rounded-xl border p-4 text-left transition-all ${
                tipoOT === 'Correctivo'
                  ? 'border-[#F2620F] bg-[#F2620F]/10 text-white shadow-md'
                  : 'border-[rgba(243,239,231,0.1)] bg-[#1C1C1C] text-[#B8B2A6] hover:border-[#F2620F]/50'
              }`}
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#F2620F] text-[#16191E]">
                <Wrench className="h-5 w-5 stroke-[2.5]" />
              </div>
              <div>
                <div className="font-['Barlow_Condensed'] text-base font-bold uppercase tracking-wide text-white">
                  OT Correctiva
                </div>
                <div className="text-xs text-[#B8B2A6] mt-0.5">
                  Reparación derivada de fallas reportadas en patio o paradas no programadas. Bloquea la unidad en taller.
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setTipoOT('Preventivo')}
              className={`flex items-start gap-3 rounded-xl border p-4 text-left transition-all ${
                tipoOT === 'Preventivo'
                  ? 'border-[#3FA65C] bg-[#3FA65C]/10 text-white shadow-md'
                  : 'border-[rgba(243,239,231,0.1)] bg-[#1C1C1C] text-[#B8B2A6] hover:border-[#3FA65C]/50'
              }`}
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#3FA65C] text-[#16191E]">
                <Sparkles className="h-5 w-5 stroke-[2.5]" />
              </div>
              <div>
                <div className="font-['Barlow_Condensed'] text-base font-bold uppercase tracking-wide text-white">
                  OT Preventiva
                </div>
                <div className="text-xs text-[#B8B2A6] mt-0.5">
                  Mantenimiento programado o reposición de stock. Habilita compras de almacén sin parar la unidad.
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Parámetros de la Orden */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-semibold text-[#B8B2A6]">
              Unidad Destino
            </label>
            <select
              value={unidadId}
              onChange={e => setUnidadId(Number(e.target.value))}
              className="w-full rounded-xl border border-[rgba(243,239,231,0.15)] bg-[#1C1C1C] py-2.5 px-3 font-['Barlow_Condensed'] text-sm font-bold text-white focus:border-[#F2620F] focus:outline-none"
            >
              {unidades.map(u => (
                <option key={u.id} value={u.id}>
                  {u.id_unidad} — {u.tipo} ({u.estado})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-[#B8B2A6]">
              Mecánico Responsable
            </label>
            <select
              value={responsableId}
              onChange={e => setResponsableId(Number(e.target.value))}
              className="w-full rounded-xl border border-[rgba(243,239,231,0.15)] bg-[#1C1C1C] py-2.5 px-3 font-['Barlow_Condensed'] text-sm font-semibold text-white focus:border-[#F2620F] focus:outline-none"
            >
              {responsables.map(r => (
                <option key={r.id} value={r.id}>
                  {r.nombre} ({r.rol} - {r.tipo})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-[#B8B2A6]">
              Criticidad Operativa
            </label>
            <select
              value={criticidad}
              onChange={e => setCriticidad(e.target.value as 'Rápida' | 'Media' | 'Crítico')}
              className="w-full rounded-xl border border-[rgba(243,239,231,0.15)] bg-[#1C1C1C] py-2.5 px-3 font-['Barlow_Condensed'] text-sm font-bold text-white focus:border-[#F2620F] focus:outline-none"
            >
              <option value="Rápida">Rápida (Servicio Menor)</option>
              <option value="Media">Media (Intervención Estándar)</option>
              <option value="Crítico">Crítico (Paro Total de Unidad)</option>
            </select>
          </div>
        </div>

        {/* Diagnóstico Técnico */}
        <div>
          <label className="mb-1 block text-xs font-semibold text-[#B8B2A6]">
            Diagnóstico Técnico y Trabajos Requeridos
          </label>
          <textarea
            rows={4}
            value={diagnostico}
            onChange={e => setDiagnostico(e.target.value)}
            placeholder="Detalla los trabajos a realizar, síntomas mecánicos y pruebas previas..."
            className="w-full rounded-xl border border-[rgba(243,239,231,0.15)] bg-[#1C1C1C] py-2.5 px-3 text-xs text-white placeholder-[#B8B2A6]/50 focus:border-[#F2620F] focus:outline-none"
          />
        </div>

        {/* Materiales y Refacciones */}
        <div className="rounded-xl border border-[rgba(243,239,231,0.08)] bg-[#1C1C1C]/40 p-4 space-y-3">
          <div>
            <h4 className="font-['Barlow_Condensed'] text-sm font-bold uppercase tracking-wider text-white">
              Refacciones Requeridas (Habilitador de Requisición en Compras)
            </h4>
            <p className="text-xs text-[#B8B2A6]">
              Las refacciones listadas aquí quedan asociadas a este folio de OT para que el área de compras pueda procesar el pedido.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={nuevaPieza}
              onChange={e => setNuevaPieza(e.target.value)}
              placeholder="Nombre o descripción de la refacción (ej. Filtro de diésel primario)..."
              className="flex-1 rounded-xl border border-[rgba(243,239,231,0.15)] bg-[#14181D] py-2 px-3 text-xs text-white focus:border-[#F2620F] focus:outline-none"
            />
            <input
              type="number"
              min="1"
              value={nuevaCantidad}
              onChange={e => setNuevaCantidad(Number(e.target.value))}
              className="w-24 rounded-xl border border-[rgba(243,239,231,0.15)] bg-[#14181D] py-2 px-3 text-xs font-['Barlow_Condensed'] font-bold text-white focus:border-[#F2620F] focus:outline-none"
            />
            <button
              type="button"
              onClick={agregarMaterial}
              className="flex items-center justify-center gap-1 rounded-xl bg-[#C5A059] px-4 py-2 font-['Barlow_Condensed'] text-xs font-bold uppercase text-[#16191E] hover:bg-[#a88744] transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Agregar</span>
            </button>
          </div>

          {materiales.length > 0 && (
            <div className="space-y-1.5 pt-2">
              {materiales.map((m, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-lg bg-[#14181D] p-2.5 text-xs text-white border border-[rgba(243,239,231,0.06)]"
                >
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-[#F2620F]" />
                    <span className="font-semibold">{m.pieza}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-['Barlow_Condensed'] font-bold text-[#C5A059] tabular-nums">
                      {m.cantidad} PZ
                    </span>
                    <button
                      type="button"
                      onClick={() => removerMaterial(idx)}
                      className="text-[#B8B2A6] hover:text-[#F2620F] transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Botones de Acción */}
        <div className="flex justify-end gap-3 pt-4 border-t border-[rgba(243,239,231,0.08)]">
          <button
            type="button"
            onClick={() => navigate('/taller/ordenes')}
            className="rounded-xl border border-[rgba(243,239,231,0.15)] px-5 py-2.5 font-['Barlow_Condensed'] text-xs font-bold uppercase text-[#B8B2A6] hover:text-white transition-all cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={cargando}
            className="flex items-center gap-2 rounded-xl bg-[#F2620F] px-8 py-3 font-['Barlow_Condensed'] text-sm font-bold uppercase tracking-wider text-[#16191E] shadow-xl shadow-[#F2620F]/20 hover:bg-[#D9550C] transition-all disabled:opacity-50 cursor-pointer"
          >
            <Send className="h-4 w-4" />
            {cargando ? 'Generando OT...' : 'Emitir Orden de Trabajo'}
          </button>
        </div>
      </form>

      {/* Modal Oficial de la OT Emitida */}
      <OrdenTrabajoModal
        ot={otEmitida}
        abierto={modalAbierto}
        alCerrar={() => {
          setModalAbierto(false)
          navigate('/taller/ordenes')
        }}
      />
    </div>
  )
}

export default TallerNuevaOT
