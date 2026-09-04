import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { 
  ShoppingCart, 
  Plus, 
  Trash2, 
  Truck, 
  FileText, 
  Sparkles, 
  DollarSign, 
  Recycle 
} from 'lucide-react'
import { 
  getUnidades, 
  getOrdenesTrabajo, 
  getInventarioYonke, 
  crearCompra, 
  type UnidadApi, 
  type OrdenTrabajoApi, 
  type PiezaYonkeApi 
} from '../../lib/api'
import { useUiStore } from '../../store/useUiStore'
import { useAuthStore } from '../../store/useAuthStore'
import { OrdenCompraModal, type DetalleOrdenCompra } from '../../components/compras/OrdenCompraModal'
import { RequisicionCompraModal, type DetalleRequisicion } from '../../components/compras/RequisicionCompraModal'

interface PartidaCarrito {
  pieza: string
  cantidad: number
  precio_unitario: number
  motivo?: string
}

export const ComprasCarrito: React.FC = () => {
  const navigate = useNavigate()
  const { agregarToast } = useUiStore()
  const { usuario } = useAuthStore()

  // Catálogos
  const [unidades, setUnidades] = useState<UnidadApi[]>([])
  const [ordenesTrabajo, setOrdenesTrabajo] = useState<OrdenTrabajoApi[]>([])
  const [piezasYonke, setPiezasYonke] = useState<PiezaYonkeApi[]>([])

  // Destino y Compuerta de Validación
  const [tipoDestino, setTipoDestino] = useState<'Unidad' | 'Stock' | 'Caja Chica'>('Unidad')
  const [unidadId, setUnidadId] = useState<number>(1)
  const [otId, setOtId] = useState<number | ''>('')
  const [justificacion, setJustificacion] = useState('')

  // Proveedor y Datos Fiscales
  const [proveedor, setProveedor] = useState('Refaccionaria Diésel del Norte')
  const [categoria] = useState<'Refacción' | 'Llantas' | 'Mantenimiento' | 'Insumos' | 'Herramientas'>('Refacción')
  const [moneda, setMoneda] = useState<'MXN' | 'USD'>('MXN')
  const [condicionPago, setCondicionPago] = useState<'Contado' | 'Crédito 15 días' | 'Crédito 30 días'>('Crédito 15 días')

  // Partidas del Carrito
  const [partidas, setPartidas] = useState<PartidaCarrito[]>([
    { pieza: 'Filtro de Diésel Primario FS19764', cantidad: 2, precio_unitario: 850 },
    { pieza: 'Aceite Mobil Delvac 15W40 (Cubeta 19L)', cantidad: 1, precio_unitario: 2400 },
  ])
  const [nuevaPieza, setNuevaPieza] = useState('')
  const [nuevaCantidad, setNuevaCantidad] = useState(1)
  const [nuevoPrecio, setNuevoPrecio] = useState<number>(0)
  const [cargando, setCargando] = useState(false)

  // Coincidencia con Yonke
  const [sugerenciaYonke, setSugerenciaYonke] = useState<PiezaYonkeApi | null>(null)

  // Modales de Documentos Oficiales
  const [ocEmitida, setOcEmitida] = useState<DetalleOrdenCompra | null>(null)
  const [modalOCAbierto, setModalOCAbierto] = useState(false)
  const [reqEmitida, setReqEmitida] = useState<DetalleRequisicion | null>(null)
  const [modalReqAbierto, setModalReqAbierto] = useState(false)

  const fallbackUnidades: UnidadApi[] = [
    { id: 1, id_unidad: 'WH-101', tipo: 'Tractor', estado: 'Inactivo', valor_referencia: 850000, costo_real_acumulado: 0, candidata_reincidencia: false },
    { id: 2, id_unidad: 'WH-104', tipo: 'Tractor', estado: 'Activo', valor_referencia: 920000, costo_real_acumulado: 0, candidata_reincidencia: false },
    { id: 3, id_unidad: 'WH-125', tipo: 'Tractor', estado: 'Activo', valor_referencia: 780000, costo_real_acumulado: 0, candidata_reincidencia: false },
    { id: 4, id_unidad: 'CJ-502', tipo: 'Caja', estado: 'Activo', valor_referencia: 320000, costo_real_acumulado: 0, candidata_reincidencia: false },
  ]

  const fallbackOTs: OrdenTrabajoApi[] = [
    { 
      id: 1, 
      folio: 'OT-2026-84741', 
      diagnostico: 'Revisión y cambio de luces y balatas', 
      unidad: { id: 1, id_unidad: 'WH-101', tipo: 'Tractor' }, 
      responsable: { nombre: 'Carlos Méndez', rol: 'Mecánico A' }, 
      materiales: [],
      archivos_evidencia: [],
      created_at: '2026-09-03',
      estado: 'Activa' 
    },
    { 
      id: 2, 
      folio: 'OT-2026-90214', 
      diagnostico: 'Mantenimiento Preventivo de Stock 10,000 KM', 
      unidad: { id: 2, id_unidad: 'WH-104', tipo: 'Tractor' }, 
      responsable: { nombre: 'Luis Morales', rol: 'Mecánico B' }, 
      materiales: [],
      archivos_evidencia: [],
      created_at: '2026-09-03',
      estado: 'Activa' 
    },
  ]

  useEffect(() => {
    async function cargarDatos() {
      try {
        const [listaUnidades, listaOTs, listaYonke] = await Promise.all([
          getUnidades().catch(() => fallbackUnidades),
          getOrdenesTrabajo().catch(() => fallbackOTs),
          getInventarioYonke().catch(() => [
            { id: 1, id_pieza: 'YK-ALT-01', unidad_origen_id: 1, nombre_pieza: 'Alternador Delco Remy 24V', categoria: 'Eléctrico', estado_pieza: 'Excelente' as const, disponible: true, ubicacion_almacen: 'RACK-B2', unidad_origen: 'WH-099' },
            { id: 2, id_pieza: 'YK-MAR-02', unidad_origen_id: 1, nombre_pieza: 'Marcha de Arranque Cummins ISX', categoria: 'Motor', estado_pieza: 'Bueno' as const, disponible: true, ubicacion_almacen: 'RACK-A1', unidad_origen: 'WH-098' },
          ]),
        ])
        const finalUnidades = listaUnidades && listaUnidades.length > 0 ? listaUnidades : fallbackUnidades
        setUnidades(finalUnidades)
        if (finalUnidades.length > 0) setUnidadId(finalUnidades[0].id)

        const finalOTs = listaOTs && listaOTs.length > 0 ? listaOTs : fallbackOTs
        setOrdenesTrabajo(finalOTs)
        if (finalOTs.length > 0) setOtId(finalOTs[0].id)

        setPiezasYonke(listaYonke)
      } catch (err) {
        console.error('Error al cargar datos de compras', err)
      }
    }
    cargarDatos()
  }, [])

  // Buscar coincidencia en Yonke al teclear la refacción
  useEffect(() => {
    if (!nuevaPieza.trim() || piezasYonke.length === 0) {
      setSugerenciaYonke(null)
      return
    }
    const match = piezasYonke.find(
      y => y.disponible && y.nombre_pieza.toLowerCase().includes(nuevaPieza.toLowerCase())
    )
    setSugerenciaYonke(match || null)
  }, [nuevaPieza, piezasYonke])

  const agregarPartida = () => {
    if (!nuevaPieza.trim()) return
    setPartidas([
      ...partidas,
      {
        pieza: nuevaPieza.trim(),
        cantidad: Number(nuevaCantidad) || 1,
        precio_unitario: Number(nuevoPrecio) || 0,
      },
    ])
    setNuevaPieza('')
    setNuevaCantidad(1)
    setNuevoPrecio(0)
    setSugerenciaYonke(null)
  }

  const removerPartida = (idx: number) => {
    setPartidas(partidas.filter((_, i) => i !== idx))
  }

  // Cálculos
  const subtotal = partidas.reduce((acc, p) => acc + p.cantidad * p.precio_unitario, 0)
  const iva = Math.round(subtotal * 0.16 * 100) / 100
  const total = subtotal + iva

  // Validar compuerta antes de emitir
  const validarCompuerta = (): boolean => {
    if (partidas.length === 0) {
      agregarToast({
        tipo: 'error',
        titulo: 'Carrito Vacío',
        mensaje: 'Debes agregar al menos una refacción o partida al carrito.',
      })
      return false
    }

    if (tipoDestino === 'Unidad' && !otId) {
      agregarToast({
        tipo: 'error',
        titulo: 'Compuerta de Compra Bloqueada',
        mensaje: 'Toda compra asignada a una unidad DEBE estar vinculada a una OT Activa o En Proceso.',
      })
      return false
    }

    if (tipoDestino === 'Caja Chica' && !justificacion.trim()) {
      agregarToast({
        tipo: 'error',
        titulo: 'Justificación Requerida',
        mensaje: 'Las compras de Caja Chica / Gasto Menor requieren una justificación obligatoria.',
      })
      return false
    }

    return true
  }

  const generarRequisicion = () => {
    if (!validarCompuerta()) return

    const uni = unidades.find(u => u.id === unidadId)
    const ot = ordenesTrabajo.find(o => o.id === otId)
    const folioReq = `REQ-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`

    const req: DetalleRequisicion = {
      folio: folioReq,
      fecha: new Date().toISOString().substring(0, 10),
      solicitante: usuario?.nombre || 'Coordinador de Taller / Compras',
      tipo_destino: tipoDestino,
      unidad_id: tipoDestino === 'Unidad' ? uni?.id_unidad : undefined,
      folio_ot: tipoDestino === 'Unidad' ? (ot?.folio || 'OT-ACTIVA') : undefined,
      justificacion: tipoDestino === 'Caja Chica' ? justificacion : undefined,
      items: partidas.map(p => ({ pieza: p.pieza, cantidad: p.cantidad })),
      estado: 'Pendiente',
    }

    setReqEmitida(req)
    setModalReqAbierto(true)
    agregarToast({
      tipo: 'info',
      titulo: 'Requisición Generada',
      mensaje: `Se emitió la Requisición ${folioReq} para autorización.`,
    })
  }

  const emitirOrdenCompra = async () => {
    if (!validarCompuerta()) return

    setCargando(true)
    try {
      const uni = unidades.find(u => u.id === unidadId)
      const ot = ordenesTrabajo.find(o => o.id === otId)
      const folioOC = `OC-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`

      // Registrar compra en el backend
      await crearCompra({
        unidad_id: tipoDestino === 'Unidad' ? unidadId : undefined,
        orden_trabajo_id: tipoDestino === 'Unidad' && typeof otId === 'number' ? otId : undefined,
        proveedor,
        categoria,
        monto: total,
        moneda,
        es_caja_chica: tipoDestino === 'Caja Chica',
        descripcion: `[${folioOC}] ${partidas.map(p => `${p.cantidad}x ${p.pieza}`).join(', ')}`,
      })

      const oc: DetalleOrdenCompra = {
        folio: folioOC,
        fecha: new Date().toISOString().substring(0, 10),
        proveedor,
        condicion_pago: condicionPago,
        moneda,
        unidad_id: tipoDestino === 'Unidad' ? uni?.id_unidad : undefined,
        folio_ot: tipoDestino === 'Unidad' ? (ot?.folio || 'OT-ACTIVA') : undefined,
        categoria,
        es_caja_chica: tipoDestino === 'Caja Chica',
        partidas,
        subtotal,
        iva,
        total,
        solicitado_por: usuario?.nombre || 'Comprador Warhorse',
        estado: 'Aprobada',
      }

      setOcEmitida(oc)
      setModalOCAbierto(true)
      agregarToast({
        tipo: 'success',
        titulo: 'Orden de Compra Emitida',
        mensaje: `Se generó la Orden de Compra ${folioOC} por $${total.toLocaleString()} ${moneda}.`,
      })
    } catch (err: unknown) {
      agregarToast({
        tipo: 'error',
        titulo: 'Error al Emitir Compra',
        mensaje: err instanceof Error ? err.message : 'Error al conectar con la API de compras.',
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
          <div className="flex items-center gap-2">
            <span className="rounded bg-[#F2620F]/20 px-2 py-0.5 font-['Barlow_Condensed'] text-xs font-bold uppercase tracking-wider text-[#F2620F]">
              Módulo Compras
            </span>
            <span className="rounded bg-[#C5A059]/20 px-2 py-0.5 font-['Barlow_Condensed'] text-xs font-bold uppercase tracking-wider text-[#C5A059]">
              Gestión de Adquisiciones
            </span>
          </div>
          <h1 className="mt-1 font-['Barlow_Condensed'] text-3xl font-extrabold uppercase tracking-wide text-white sm:text-4xl">
            Carrito de Refacciones & Compras
          </h1>
          <p className="text-xs text-[#B8B2A6]">
            Adquisición regulada con compuerta estricta: requiere OT activa para unidades o justificación para caja chica.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/compras/Yonke')}
            className="flex items-center gap-1.5 rounded-xl border border-[#3FA65C]/40 bg-[#3FA65C]/10 px-3.5 py-2 font-['Barlow_Condensed'] text-xs font-bold uppercase tracking-wider text-[#3FA65C] hover:bg-[#3FA65C]/20 transition-all cursor-pointer"
          >
            <Recycle className="h-4 w-4" />
            <span>Almacén Yonke ($0 Costo)</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/compras/cola')}
            className="flex items-center gap-1.5 rounded-xl border border-[rgba(243,239,231,0.15)] bg-[#14181D] px-3.5 py-2 text-xs font-semibold text-[#f3f4f6] hover:border-white transition-all cursor-pointer"
          >
            <FileText className="h-4 w-4 text-[#B8B2A6]" />
            <span>Cola de Compras</span>
          </button>
        </div>
      </div>

      {/* Grid Principal: Formulario de Destino & Carrito */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna Izquierda: Compuerta de Validación y Proveedor (2 columnas) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tarjeta 1: Compuerta de Validación de Destino */}
          <div className="rounded-2xl border border-[rgba(243,239,231,0.1)] bg-[#14181D]/80 p-6 space-y-5">
            <div>
              <div className="font-['Barlow_Condensed'] text-xs font-bold uppercase tracking-wider text-[#C5A059]">
                COMPUERTA OPERATIVA OBLIGATORIA
              </div>
              <h3 className="font-['Barlow_Condensed'] text-xl font-bold uppercase text-white">
                Destino del Pedido
              </h3>
            </div>

            {/* Selector de Destino */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setTipoDestino('Unidad')}
                className={`flex flex-col items-start rounded-xl border p-3 text-left transition-all ${
                  tipoDestino === 'Unidad'
                    ? 'border-[#F2620F] bg-[#F2620F]/10 text-white shadow-md'
                    : 'border-[rgba(243,239,231,0.1)] bg-[#1C1C1C] text-[#B8B2A6] hover:border-[#F2620F]/50'
                }`}
              >
                <div className="flex items-center gap-1.5 font-['Barlow_Condensed'] text-sm font-bold uppercase tracking-wider text-[#F2620F]">
                  <Truck className="h-4 w-4" />
                  Asignado a Unidad
                </div>
                <div className="text-[11px] text-[#B8B2A6] mt-1">
                  Exige vincular una Orden de Trabajo Activa en taller.
                </div>
              </button>

              <button
                type="button"
                onClick={() => setTipoDestino('Stock')}
                className={`flex flex-col items-start rounded-xl border p-3 text-left transition-all ${
                  tipoDestino === 'Stock'
                    ? 'border-[#3FA65C] bg-[#3FA65C]/10 text-white shadow-md'
                    : 'border-[rgba(243,239,231,0.1)] bg-[#1C1C1C] text-[#B8B2A6] hover:border-[#3FA65C]/50'
                }`}
              >
                <div className="flex items-center gap-1.5 font-['Barlow_Condensed'] text-sm font-bold uppercase tracking-wider text-[#3FA65C]">
                  <Sparkles className="h-4 w-4" />
                  Stock General
                </div>
                <div className="text-[11px] text-[#B8B2A6] mt-1">
                  Abasto de almacén vinculado a OT Preventiva.
                </div>
              </button>

              <button
                type="button"
                onClick={() => setTipoDestino('Caja Chica')}
                className={`flex flex-col items-start rounded-xl border p-3 text-left transition-all ${
                  tipoDestino === 'Caja Chica'
                    ? 'border-[#E0C36A] bg-[#E0C36A]/10 text-white shadow-md'
                    : 'border-[rgba(243,239,231,0.1)] bg-[#1C1C1C] text-[#B8B2A6] hover:border-[#E0C36A]/50'
                }`}
              >
                <div className="flex items-center gap-1.5 font-['Barlow_Condensed'] text-sm font-bold uppercase tracking-wider text-[#E0C36A]">
                  <DollarSign className="h-4 w-4" />
                  Caja Chica
                </div>
                <div className="text-[11px] text-[#B8B2A6] mt-1">
                  Gasto menor o tornillería. Requiere justificación.
                </div>
              </button>
            </div>

            {/* Campos condicionales según Destino */}
            {tipoDestino === 'Unidad' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[rgba(243,239,231,0.06)]">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#B8B2A6]">
                    Unidad Destino
                  </label>
                  <select
                    value={unidadId}
                    onChange={e => setUnidadId(Number(e.target.value))}
                    className="w-full rounded-xl border border-[rgba(243,239,231,0.15)] bg-[#1C1C1C] py-2 px-3 font-['Barlow_Condensed'] text-sm font-bold text-white focus:border-[#F2620F] focus:outline-none"
                  >
                    {unidades.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.id_unidad} — {u.tipo} ({u.estado})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 flex items-center justify-between text-xs font-semibold text-[#B8B2A6]">
                    <span>Orden de Trabajo (OT) Activa *</span>
                    <span className="text-[10px] text-[#F2620F] font-bold uppercase font-['Barlow_Condensed']">
                      Obligatoria
                    </span>
                  </label>
                  <select
                    value={otId}
                    onChange={e => setOtId(Number(e.target.value))}
                    className="w-full rounded-xl border border-[#F2620F]/50 bg-[#1C1C1C] py-2 px-3 font-['Barlow_Condensed'] text-sm font-bold text-white focus:border-[#F2620F] focus:outline-none"
                  >
                    {ordenesTrabajo.map(ot => (
                      <option key={ot.id} value={ot.id}>
                        {ot.folio} — {ot.diagnostico.substring(0, 35)}...
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {tipoDestino === 'Stock' && (
              <div className="pt-2 border-t border-[rgba(243,239,231,0.06)]">
                <label className="mb-1 block text-xs font-semibold text-[#B8B2A6]">
                  OT Preventiva Asociada (Opcional para Almacén General)
                </label>
                <select
                  value={otId}
                  onChange={e => setOtId(Number(e.target.value))}
                  className="w-full rounded-xl border border-[rgba(243,239,231,0.15)] bg-[#1C1C1C] py-2 px-3 font-['Barlow_Condensed'] text-sm font-bold text-white focus:border-[#3FA65C] focus:outline-none"
                >
                  <option value="">Abasto de Almacén General (Sin OT)</option>
                  {ordenesTrabajo.map(ot => (
                    <option key={ot.id} value={ot.id}>
                      {ot.folio} — Preventiva ({ot.unidad?.id_unidad})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {tipoDestino === 'Caja Chica' && (
              <div className="pt-2 border-t border-[rgba(243,239,231,0.06)] space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#E0C36A] font-['Barlow_Condensed']">
                  Justificación Obligatoria de Gasto Menor
                </label>
                <textarea
                  rows={2}
                  value={justificacion}
                  onChange={e => setJustificacion(e.target.value)}
                  placeholder="Describe la necesidad del gasto (ej. Abrazaderas y tornillería de urgencia en patio)..."
                  className="w-full rounded-xl border border-[#E0C36A]/40 bg-[#1C1C1C] py-2 px-3 text-xs text-white placeholder-[#B8B2A6]/50 focus:border-[#E0C36A] focus:outline-none"
                />
              </div>
            )}
          </div>

          {/* Tarjeta 2: Agregar Partidas al Carrito & Alerta Yonke */}
          <div className="rounded-2xl border border-[rgba(243,239,231,0.1)] bg-[#14181D]/80 p-6 space-y-4">
            <h3 className="font-['Barlow_Condensed'] text-xl font-bold uppercase text-white">
              Agregar Refacciones al Carrito
            </h3>

            {/* Banner reactivo de Sugerencia Yonke */}
            {sugerenciaYonke && (
              <div className="flex items-center justify-between rounded-xl border border-[#3FA65C]/40 bg-[#3FA65C]/10 p-3 text-xs animate-in fade-in">
                <div className="flex items-center gap-2.5">
                  <Recycle className="h-5 w-5 text-[#3FA65C] shrink-0" />
                  <div>
                    <span className="font-['Barlow_Condensed'] text-sm font-bold uppercase text-[#3FA65C]">
                      ¡Pieza Disponible en Almacén Yonke ($0 Costo)!
                    </span>
                    <p className="text-[#B8B2A6] text-[11px]">
                      {sugerenciaYonke.nombre_pieza} en {sugerenciaYonke.ubicacion_almacen} (Origen: {sugerenciaYonke.unidad_origen || 'WH-099'}).
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/compras/Yonke')}
                  className="rounded-lg bg-[#3FA65C] px-3 py-1.5 font-['Barlow_Condensed'] text-xs font-bold uppercase text-[#16191E] hover:bg-[#2e7d44] transition-all cursor-pointer shrink-0 ml-2"
                >
                  Usar Yonke
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-semibold text-[#B8B2A6]">
                  Descripción de la Refacción
                </label>
                <input
                  type="text"
                  value={nuevaPieza}
                  onChange={e => setNuevaPieza(e.target.value)}
                  placeholder="Ej. Balatas de freno traseras Meritor..."
                  className="w-full rounded-xl border border-[rgba(243,239,231,0.15)] bg-[#1C1C1C] py-2 px-3 text-xs text-white focus:border-[#F2620F] focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-[#B8B2A6]">
                  Cantidad
                </label>
                <input
                  type="number"
                  min="1"
                  value={nuevaCantidad}
                  onChange={e => setNuevaCantidad(Number(e.target.value))}
                  className="w-full rounded-xl border border-[rgba(243,239,231,0.15)] bg-[#1C1C1C] py-2 px-3 font-['Barlow_Condensed'] text-sm font-bold text-white focus:border-[#F2620F] focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-[#B8B2A6]">
                  Precio Unitario ($)
                </label>
                <input
                  type="number"
                  min="0"
                  step="50"
                  value={nuevoPrecio}
                  onChange={e => setNuevoPrecio(Number(e.target.value))}
                  className="w-full rounded-xl border border-[rgba(243,239,231,0.15)] bg-[#1C1C1C] py-2 px-3 font-['Barlow_Condensed'] text-sm font-bold text-white focus:border-[#F2620F] focus:outline-none"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={agregarPartida}
              className="flex items-center justify-center gap-2 rounded-xl bg-[#C5A059] w-full py-2.5 font-['Barlow_Condensed'] text-xs font-bold uppercase tracking-wider text-[#16191E] hover:bg-[#a88744] transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4 stroke-[3]" />
              <span>Agregar al Carrito</span>
            </button>
          </div>
        </div>

        {/* Columna Derecha: Resumen del Carrito & Emisión (1 columna) */}
        <div className="space-y-6">
          {/* Tarjeta de Proveedor y Condiciones */}
          <div className="rounded-2xl border border-[rgba(243,239,231,0.1)] bg-[#14181D]/80 p-5 space-y-4">
            <h4 className="font-['Barlow_Condensed'] text-base font-bold uppercase text-white">
              Datos Comerciales
            </h4>

            <div>
              <label className="mb-1 block text-xs font-semibold text-[#B8B2A6]">
                Proveedor
              </label>
              <input
                type="text"
                value={proveedor}
                onChange={e => setProveedor(e.target.value)}
                className="w-full rounded-xl border border-[rgba(243,239,231,0.15)] bg-[#1C1C1C] py-2 px-3 text-xs text-white focus:border-[#F2620F] focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#B8B2A6]">
                  Moneda
                </label>
                <select
                  value={moneda}
                  onChange={e => setMoneda(e.target.value as 'MXN' | 'USD')}
                  className="w-full rounded-xl border border-[rgba(243,239,231,0.15)] bg-[#1C1C1C] py-1.5 px-2 font-['Barlow_Condensed'] text-xs font-bold text-white focus:border-[#F2620F] focus:outline-none"
                >
                  <option value="MXN">MXN ($)</option>
                  <option value="USD">USD ($)</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-[#B8B2A6]">
                  Condición
                </label>
                <select
                  value={condicionPago}
                  onChange={e => setCondicionPago(e.target.value as typeof condicionPago)}
                  className="w-full rounded-xl border border-[rgba(243,239,231,0.15)] bg-[#1C1C1C] py-1.5 px-2 font-['Barlow_Condensed'] text-xs font-bold text-white focus:border-[#F2620F] focus:outline-none"
                >
                  <option value="Contado">Contado</option>
                  <option value="Crédito 15 días">Crédito 15d</option>
                  <option value="Crédito 30 días">Crédito 30d</option>
                </select>
              </div>
            </div>
          </div>

          {/* Tarjeta de Resumen de Partidas y Totales */}
          <div className="rounded-2xl border border-[rgba(243,239,231,0.1)] bg-[#14181D]/80 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[rgba(243,239,231,0.08)] pb-3">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 text-[#F2620F]" />
                <h4 className="font-['Barlow_Condensed'] text-base font-bold uppercase text-white">
                  Partidas ({partidas.length})
                </h4>
              </div>
            </div>

            {/* Listado de partidas en carrito */}
            <div className="space-y-2 max-h-56 overflow-y-auto">
              {partidas.length === 0 ? (
                <div className="py-6 text-center text-xs text-[#B8B2A6]">
                  El carrito está vacío. Agrega refacciones arriba.
                </div>
              ) : (
                partidas.map((p, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-xl bg-[#1C1C1C] p-2.5 text-xs text-white border border-[rgba(243,239,231,0.06)]"
                  >
                    <div className="max-w-[170px]">
                      <div className="font-medium text-white truncate">{p.pieza}</div>
                      <div className="text-[10px] text-[#B8B2A6]">
                        {p.cantidad} x ${p.precio_unitario.toLocaleString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-['Barlow_Condensed'] font-bold text-[#F2620F] tabular-nums">
                        ${(p.cantidad * p.precio_unitario).toLocaleString()}
                      </span>
                      <button
                        type="button"
                        onClick={() => removerPartida(idx)}
                        className="text-[#B8B2A6] hover:text-[#F2620F] transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Desglose de Totales */}
            <div className="space-y-1.5 border-t border-[rgba(243,239,231,0.08)] pt-3 text-xs font-['Barlow_Condensed']">
              <div className="flex justify-between text-[#B8B2A6]">
                <span>Subtotal:</span>
                <span className="font-bold tabular-nums text-white">
                  ${subtotal.toLocaleString()} {moneda}
                </span>
              </div>
              <div className="flex justify-between text-[#B8B2A6]">
                <span>IVA (16%):</span>
                <span className="font-bold tabular-nums text-white">
                  ${iva.toLocaleString()} {moneda}
                </span>
              </div>
              <div className="flex justify-between border-t border-[rgba(243,239,231,0.08)] pt-2 text-base text-white">
                <span className="font-bold uppercase tracking-wider text-[#F2620F]">
                  Total a Pagar:
                </span>
                <span className="font-black tabular-nums text-[#F2620F]">
                  ${total.toLocaleString()} {moneda}
                </span>
              </div>
            </div>

            {/* Botones de Emisión */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={emitirOrdenCompra}
                disabled={cargando || partidas.length === 0}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#F2620F] py-3 font-['Barlow_Condensed'] text-sm font-bold uppercase tracking-wider text-[#16191E] shadow-lg shadow-[#F2620F]/20 hover:bg-[#D9550C] transition-all disabled:opacity-50 cursor-pointer"
              >
                <ShoppingCart className="h-4 w-4" />
                <span>{cargando ? 'Procesando...' : 'Emitir Orden de Compra (OC)'}</span>
              </button>

              <button
                type="button"
                onClick={generarRequisicion}
                disabled={partidas.length === 0}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-[rgba(243,239,231,0.15)] bg-[#14181D] py-2.5 font-['Barlow_Condensed'] text-xs font-bold uppercase tracking-wider text-[#C5A059] hover:border-[#C5A059] transition-all cursor-pointer"
              >
                <FileText className="h-3.5 w-3.5" />
                <span>Generar Requisición Interna</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modales Oficiales de Requisición y OC */}
      <RequisicionCompraModal
        requisicion={reqEmitida}
        abierto={modalReqAbierto}
        alCerrar={() => setModalReqAbierto(false)}
      />

      <OrdenCompraModal
        oc={ocEmitida}
        abierto={modalOCAbierto}
        alCerrar={() => {
          setModalOCAbierto(false)
          navigate('/compras/cola')
        }}
      />
    </div>
  )
}

export default ComprasCarrito

