import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { 
  Plus, 
  Search, 
  DollarSign, 
  CheckCircle2, 
  Clock, 
  Truck, 
  FileText, 
  RotateCw,
  Sparkles
} from 'lucide-react'
import { getCompras, type CompraApi } from '../../lib/api'
import { OrdenCompraModal, type DetalleOrdenCompra } from '../../components/compras/OrdenCompraModal'

export const ComprasCola: React.FC = () => {
  const navigate = useNavigate()

  const [compras, setCompras] = useState<CompraApi[]>([])
  const [cargando, setCargando] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState<string>('Todas')

  const [ocSeleccionada, setOcSeleccionada] = useState<DetalleOrdenCompra | null>(null)
  const [modalOCAbierto, setModalOCAbierto] = useState(false)

  const fallbackCompras: CompraApi[] = [
    {
      id: 1,
      unidad_id: 1,
      id_unidad: 'WH-101',
      categoria: 'Refacción',
      proveedor: 'Refaccionaria Diésel del Norte',
      monto: 3770,
      moneda: 'MXN',
      descripcion: '[OC-2026-89412] Filtro de Diésel Primario FS19764 y Aceite Mobil Delvac 15W40',
      es_caja_chica: false,
      estado: 'Aprobada',
      fecha: new Date().toISOString().substring(0, 10),
    },
    {
      id: 2,
      categoria: 'Insumos',
      proveedor: 'Ferretería y Tornillos del Centro',
      monto: 650,
      moneda: 'MXN',
      descripcion: '[OC-2026-77310] Tornillería y abrazaderas de alta presión para taller',
      es_caja_chica: true,
      estado: 'Pagada',
      fecha: new Date().toISOString().substring(0, 10),
    },
    {
      id: 3,
      unidad_id: 2,
      id_unidad: 'WH-104',
      categoria: 'Llantas',
      proveedor: 'Llantas y Renovados de Chihuahua',
      monto: 16500,
      moneda: 'MXN',
      descripcion: '[OC-2026-61029] Juego de 2 llantas de tracción 295/75R22.5 Bridgestone',
      es_caja_chica: false,
      estado: 'Pendiente',
      fecha: new Date().toISOString().substring(0, 10),
    },
  ]

  const cargarCompras = async () => {
    setCargando(true)
    try {
      const lista = await getCompras().catch(() => fallbackCompras)
      setCompras(lista && lista.length > 0 ? lista : fallbackCompras)
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargarCompras()
  }, [])

  // Métricas
  const totalInvertido = compras.reduce((acc, c) => acc + Number(c.monto || 0), 0)
  const totalCajaChica = compras.filter(c => c.es_caja_chica).length
  const totalPendientes = compras.filter(c => c.estado === 'Pendiente').length
  const totalAprobadas = compras.filter(c => c.estado === 'Aprobada' || c.estado === 'Pagada').length

  const comprasFiltradas = compras.filter(c => {
    const texto = `${c.proveedor} ${c.descripcion || ''} ${c.id_unidad || ''} ${c.categoria}`.toLowerCase()
    if (!texto.includes(busqueda.toLowerCase())) return false
    if (filtroCategoria !== 'Todas' && c.categoria !== filtroCategoria) return false
    return true
  })

  const abrirOC = (c: CompraApi) => {
    const totalNum = Number(c.monto) || 0
    const subtotal = totalNum > 0 ? Math.round((totalNum / 1.16) * 100) / 100 : 0
    const iva = totalNum > 0 ? Math.round((totalNum - subtotal) * 100) / 100 : 0

    const detalle: DetalleOrdenCompra = {
      id: c.id,
      folio: `OC-${new Date().getFullYear()}-${String(c.id).padStart(5, '0')}`,
      fecha: c.fecha || new Date().toISOString().substring(0, 10),
      proveedor: c.proveedor || 'Proveedor Nacional de Autotransporte',
      condicion_pago: 'Crédito 15 días',
      moneda: (c.moneda as 'MXN' | 'USD') || 'MXN',
      unidad_id: c.id_unidad || 'Almacén General',
      categoria: c.categoria || 'Mantenimiento',
      es_caja_chica: Boolean(c.es_caja_chica),
      partidas: [
        {
          pieza: c.descripcion || 'Refacción o servicio de mantenimiento',
          cantidad: 1,
          precio_unitario: subtotal,
        },
      ],
      subtotal,
      iva,
      total: totalNum,
      solicitado_por: 'Área de Compras Warhorse',
      estado: (c.estado as DetalleOrdenCompra['estado']) || 'Aprobada',
    }

    setOcSeleccionada(detalle)
    setModalOCAbierto(true)
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
              Control de Egresos & OCs
            </span>
          </div>
          <h1 className="mt-1 font-['Barlow_Condensed'] text-3xl font-extrabold uppercase tracking-wide text-white sm:text-4xl">
            Cola de Compras y Requisiciones
          </h1>
          <p className="text-xs text-[#B8B2A6]">
            Histórico de órdenes de compra emitidas, compras de caja chica y validación de costos por unidad.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={cargarCompras}
            className="flex items-center gap-1.5 rounded-xl border border-[rgba(243,239,231,0.15)] bg-[#14181D] px-3.5 py-2 text-xs font-semibold text-[#f3f4f6] hover:border-white transition-all cursor-pointer"
          >
            <RotateCw className="h-3.5 w-3.5 text-[#B8B2A6]" />
            <span>Refrescar</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/compras/carrito')}
            className="flex items-center gap-2 rounded-xl bg-[#F2620F] px-5 py-2.5 font-['Barlow_Condensed'] text-xs font-bold uppercase tracking-wider text-[#16191E] shadow-lg shadow-[#F2620F]/20 hover:bg-[#D9550C] transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4 stroke-[3]" />
            <span>Nueva Compra</span>
          </button>
        </div>
      </div>

      {/* Tarjetas de Métricas Rápidas */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-[rgba(243,239,231,0.08)] bg-[#14181D]/80 p-4">
          <div className="flex items-center justify-between text-xs text-[#B8B2A6]">
            <span>Inversión Total Acumulada</span>
            <DollarSign className="h-4 w-4 text-[#F2620F]" />
          </div>
          <div className="mt-1 font-['Barlow_Condensed'] text-2xl sm:text-3xl font-black text-[#F2620F] tabular-nums">
            ${totalInvertido.toLocaleString()} MXN
          </div>
          <div className="text-[10px] text-[#B8B2A6] mt-0.5">{compras.length} compras registradas</div>
        </div>

        <div className="rounded-xl border border-[rgba(243,239,231,0.08)] bg-[#14181D]/80 p-4">
          <div className="flex items-center justify-between text-xs text-[#B8B2A6]">
            <span>Órdenes Aprobadas</span>
            <CheckCircle2 className="h-4 w-4 text-[#3FA65C]" />
          </div>
          <div className="mt-1 font-['Barlow_Condensed'] text-3xl font-black text-[#3FA65C] tabular-nums">
            {totalAprobadas}
          </div>
          <div className="text-[10px] text-[#B8B2A6] mt-0.5">Listas para facturación</div>
        </div>

        <div className="rounded-xl border border-[rgba(243,239,231,0.08)] bg-[#14181D]/80 p-4">
          <div className="flex items-center justify-between text-xs text-[#B8B2A6]">
            <span>Pendientes de Aprobación</span>
            <Clock className="h-4 w-4 text-[#E0C36A]" />
          </div>
          <div className="mt-1 font-['Barlow_Condensed'] text-3xl font-black text-[#E0C36A] tabular-nums">
            {totalPendientes}
          </div>
          <div className="text-[10px] text-[#B8B2A6] mt-0.5">Requieren firma directiva</div>
        </div>

        <div className="rounded-xl border border-[rgba(243,239,231,0.08)] bg-[#14181D]/80 p-4">
          <div className="flex items-center justify-between text-xs text-[#B8B2A6]">
            <span>Compras Caja Chica</span>
            <Sparkles className="h-4 w-4 text-[#C5A059]" />
          </div>
          <div className="mt-1 font-['Barlow_Condensed'] text-3xl font-black text-white tabular-nums">
            {totalCajaChica}
          </div>
          <div className="text-[10px] text-[#B8B2A6] mt-0.5">Gastos menores de patio</div>
        </div>
      </div>

      {/* Filtros y Tabla */}
      <div className="rounded-2xl border border-[rgba(243,239,231,0.1)] bg-[#14181D]/80 p-5 space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative flex-1 w-full sm:max-w-md">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-[#B8B2A6]" />
            <input
              type="text"
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              placeholder="Buscar por proveedor, refacción o unidad..."
              className="w-full rounded-xl border border-[rgba(243,239,231,0.15)] bg-[#1C1C1C] py-2 pl-10 pr-3 text-xs text-white placeholder-[#B8B2A6]/50 focus:border-[#F2620F] focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
            {['Todas', 'Refacción', 'Llantas', 'Mantenimiento', 'Insumos'].map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setFiltroCategoria(cat)}
                className={`rounded-lg px-3 py-1.5 font-['Barlow_Condensed'] text-xs font-bold uppercase tracking-wider transition-all ${
                  filtroCategoria === cat
                    ? 'bg-[#F2620F] text-[#16191E]'
                    : 'bg-[#1C1C1C] text-[#B8B2A6] hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Tabla Densa de Compras */}
        <div className="overflow-x-auto rounded-xl border border-[rgba(243,239,231,0.08)] bg-[#1C1C1C]/40">
          <table className="w-full text-left text-xs text-[#f3f4f6]">
            <thead className="border-b border-[rgba(243,239,231,0.1)] bg-[#1C1C1C] font-['Barlow_Condensed'] uppercase tracking-wider text-[#B8B2A6]">
              <tr>
                <th className="px-4 py-3">Folio / Fecha</th>
                <th className="px-4 py-3">Proveedor</th>
                <th className="px-4 py-3">Destino</th>
                <th className="px-4 py-3">Categoría</th>
                <th className="px-4 py-3">Descripción</th>
                <th className="px-4 py-3 text-right">Monto</th>
                <th className="px-4 py-3">Estatus</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(243,239,231,0.06)] font-['Barlow']">
              {cargando ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-xs text-[#B8B2A6]">
                    Cargando compras desde el backend local...
                  </td>
                </tr>
              ) : comprasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-xs text-[#B8B2A6]">
                    No se encontraron registros de compra para los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                comprasFiltradas.map(c => (
                  <tr key={c.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3 font-mono">
                      <div className="font-bold text-[#F2620F]">
                        OC-{new Date().getFullYear()}-{String(c.id).padStart(5, '0')}
                      </div>
                      <div className="text-[10px] text-[#B8B2A6]">{c.fecha}</div>
                    </td>
                    <td className="px-4 py-3 font-semibold text-white truncate max-w-[150px]">
                      {c.proveedor}
                    </td>
                    <td className="px-4 py-3">
                      {c.id_unidad ? (
                        <span className="inline-flex items-center gap-1 font-bold text-white">
                          <Truck className="h-3 w-3 text-[#C5A059]" />
                          {c.id_unidad}
                        </span>
                      ) : (
                        <span className="text-[11px] text-[#B8B2A6]">Almacén General</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded px-2 py-0.5 font-['Barlow_Condensed'] text-[10px] font-bold uppercase ${
                          c.es_caja_chica
                            ? 'bg-[#E0C36A]/20 text-[#E0C36A]'
                            : 'bg-white/10 text-white'
                        }`}
                      >
                        {c.es_caja_chica ? 'Caja Chica' : c.categoria}
                      </span>
                    </td>
                    <td className="px-4 py-3 max-w-[200px]">
                      <p className="line-clamp-1 text-[11px] text-[#B8B2A6]" title={c.descripcion}>
                        {c.descripcion}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-right font-['Barlow_Condensed'] text-sm font-bold tabular-nums text-white">
                      ${Number(c.monto).toLocaleString()} {c.moneda}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded px-2 py-0.5 font-['Barlow_Condensed'] text-[11px] font-bold ${
                          c.estado === 'Aprobada' || c.estado === 'Pagada'
                            ? 'bg-[#3FA65C]/20 text-[#3FA65C]'
                            : 'bg-[#E0C36A]/20 text-[#E0C36A]'
                        }`}
                      >
                        {c.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => abrirOC(c)}
                        className="inline-flex items-center gap-1 rounded-lg border border-[rgba(243,239,231,0.15)] bg-[#14181D] px-2.5 py-1 text-xs font-semibold text-[#f3f4f6] hover:border-[#F2620F] hover:text-[#F2620F] transition-all cursor-pointer"
                        title="Ver Documento Oficial"
                      >
                        <FileText className="h-3 w-3" />
                        <span>Ver OC</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Oficial de Orden de Compra */}
      <OrdenCompraModal
        oc={ocSeleccionada}
        abierto={modalOCAbierto}
        alCerrar={() => setModalOCAbierto(false)}
      />
    </div>
  )
}

export default ComprasCola
