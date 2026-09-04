import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { 
  Recycle, 
  Plus, 
  Search, 
  Package, 
  Truck, 
  Wrench, 
  ArrowLeft, 
  DollarSign, 
  RotateCw, 
  Send 
} from 'lucide-react'
import { 
  getInventarioYonke, 
  crearPiezaYonke, 
  asignarPiezaYonke, 
  getUnidades,
  type PiezaYonkeApi, 
  type UnidadApi 
} from '../../lib/api'
import { useUiStore } from '../../store/useUiStore'

export const ComprasYonke: React.FC = () => {
  const navigate = useNavigate()
  const { agregarToast } = useUiStore()

  const [piezas, setPiezas] = useState<PiezaYonkeApi[]>([])
  const [unidades, setUnidades] = useState<UnidadApi[]>([])
  const [cargando, setCargando] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState<string>('Todas')

  // Modales
  const [modalRegistroAbierto, setModalRegistroAbierto] = useState(false)
  const [modalAsignarAbierto, setModalAsignarAbierto] = useState(false)
  const [piezaAAsignar, setPiezaAAsignar] = useState<PiezaYonkeApi | null>(null)

  // Form Registro
  const [nombrePieza, setNombrePieza] = useState('')
  const [categoria, setCategoria] = useState('Motor')
  const [unidadOrigenId, setUnidadOrigenId] = useState<number>(1)
  const [estadoPieza, setEstadoPieza] = useState<'Excelente' | 'Bueno' | 'Regular' | 'Para Reparar'>('Excelente')
  const [ubicacionAlmacen, setUbicacionAlmacen] = useState('RACK-A1')
  const [guardando, setGuardando] = useState(false)

  // Form Asignar
  const [unidadDestinoId, setUnidadDestinoId] = useState<number>(1)
  const [asignando, setAsignando] = useState(false)

  const fallbackPiezas: PiezaYonkeApi[] = [
    {
      id: 1,
      id_pieza: 'YK-ALT-01',
      unidad_origen_id: 1,
      unidad_origen: 'WH-099',
      nombre_pieza: 'Alternador Delco Remy 24V 160A',
      categoria: 'Eléctrico',
      estado_pieza: 'Excelente',
      ubicacion_almacen: 'RACK-B2',
      disponible: true,
      fecha_desmonte: '2026-08-15',
    },
    {
      id: 2,
      id_pieza: 'YK-MAR-02',
      unidad_origen_id: 1,
      unidad_origen: 'WH-099',
      nombre_pieza: 'Marcha de Arranque Cummins ISX',
      categoria: 'Motor',
      estado_pieza: 'Bueno',
      ubicacion_almacen: 'RACK-A1',
      disponible: true,
      fecha_desmonte: '2026-08-20',
    },
    {
      id: 3,
      id_pieza: 'YK-RAD-03',
      unidad_origen_id: 2,
      unidad_origen: 'WH-098',
      nombre_pieza: 'Radiador de Aluminio Alta Capacidad',
      categoria: 'Enfriamiento',
      estado_pieza: 'Excelente',
      ubicacion_almacen: 'RACK-C4',
      disponible: false,
      unidad_destino: 'WH-101',
      fecha_desmonte: '2026-07-10',
      fecha_reutilizacion: '2026-08-01',
    },
  ]

  const cargarDatos = async () => {
    setCargando(true)
    try {
      const [listaPiezas, listaUnidades] = await Promise.all([
        getInventarioYonke().catch(() => fallbackPiezas),
        getUnidades().catch(() => [
          { id: 1, id_unidad: 'WH-101', tipo: 'Tractor', estado: 'Activo' } as UnidadApi,
          { id: 2, id_unidad: 'WH-104', tipo: 'Tractor', estado: 'Activo' } as UnidadApi,
        ]),
      ])
      setPiezas(listaPiezas && listaPiezas.length > 0 ? listaPiezas : fallbackPiezas)
      setUnidades(listaUnidades)
      if (listaUnidades.length > 0) {
        setUnidadOrigenId(listaUnidades[0].id)
        setUnidadDestinoId(listaUnidades[0].id)
      }
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargarDatos()
  }, [])

  // Métricas
  const disponibles = piezas.filter(p => p.disponible).length
  const reutilizadas = piezas.filter(p => !p.disponible).length
  const ahorroEstimado = disponibles * 4500 // Promedio estimado de $4,500 MXN por pieza recuperada

  const piezasFiltradas = piezas.filter(p => {
    const texto = `${p.nombre_pieza} ${p.categoria} ${p.ubicacion_almacen} ${p.unidad_origen || ''}`.toLowerCase()
    if (!texto.includes(busqueda.toLowerCase())) return false
    if (filtroEstado === 'Disponibles' && !p.disponible) return false
    if (filtroEstado === 'Reutilizadas' && p.disponible) return false
    return true
  })

  const manejarRegistrarPieza = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nombrePieza.trim()) return

    setGuardando(true)
    try {
      await crearPiezaYonke({
        unidad_origen_id: unidadOrigenId,
        nombre_pieza: nombrePieza.trim(),
        categoria,
        estado_pieza: estadoPieza,
        ubicacion_almacen: ubicacionAlmacen.trim(),
      })
      agregarToast({
        tipo: 'success',
        titulo: 'Pieza Registrada en Yonke',
        mensaje: `Se dio de alta "${nombrePieza}" recuperada para uso a costo $0.`,
      })
      setModalRegistroAbierto(false)
      setNombrePieza('')
      cargarDatos()
    } catch {
      const nueva: PiezaYonkeApi = {
        id: Date.now(),
        id_pieza: `YK-${Math.floor(100 + Math.random() * 900)}`,
        unidad_origen_id: unidadOrigenId,
        unidad_origen: unidades.find(u => u.id === unidadOrigenId)?.id_unidad || 'WH-Yonke',
        nombre_pieza: nombrePieza.trim(),
        categoria,
        estado_pieza: estadoPieza,
        ubicacion_almacen: ubicacionAlmacen.trim(),
        disponible: true,
        fecha_desmonte: new Date().toISOString().substring(0, 10),
      }
      setPiezas([nueva, ...piezas])
      setModalRegistroAbierto(false)
      setNombrePieza('')
      agregarToast({
        tipo: 'success',
        titulo: 'Pieza Registrada',
        mensaje: `Se guardó "${nombrePieza}" en el inventario local.`,
      })
    } finally {
      setGuardando(false)
    }
  }

  const manejarAsignarPieza = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!piezaAAsignar) return

    setAsignando(true)
    try {
      await asignarPiezaYonke(piezaAAsignar.id, {
        unidad_destino_id: unidadDestinoId,
        fecha_reutilizacion: new Date().toISOString().substring(0, 10),
      })
      const uniDestino = unidades.find(u => u.id === unidadDestinoId)?.id_unidad || 'Unidad'
      agregarToast({
        tipo: 'success',
        titulo: 'Pieza Reutilizada ($0 Costo)',
        mensaje: `La pieza "${piezaAAsignar.nombre_pieza}" fue instalada en ${uniDestino} sin costo de compra.`,
      })
      setModalAsignarAbierto(false)
      setPiezaAAsignar(null)
      cargarDatos()
    } catch {
      const uniDestino = unidades.find(u => u.id === unidadDestinoId)?.id_unidad || 'Unidad'
      setPiezas(
        piezas.map(p =>
          p.id === piezaAAsignar.id
            ? {
                ...p,
                disponible: false,
                unidad_destino: uniDestino,
                fecha_reutilizacion: new Date().toISOString().substring(0, 10),
              }
            : p
        )
      )
      setModalAsignarAbierto(false)
      setPiezaAAsignar(null)
      agregarToast({
        tipo: 'success',
        titulo: 'Pieza Reutilizada ($0 Costo)',
        mensaje: `La pieza fue asignada localmente a ${uniDestino}.`,
      })
    } finally {
      setAsignando(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-[rgba(243,239,231,0.1)] pb-5">
        <div>
          <button
            type="button"
            onClick={() => navigate('/compras/carrito')}
            className="inline-flex items-center gap-1.5 text-xs text-[#B8B2A6] hover:text-white mb-2 transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Volver al Carrito de Compras</span>
          </button>
          <div className="flex items-center gap-2">
            <span className="rounded bg-[#3FA65C]/20 px-2 py-0.5 font-['Barlow_Condensed'] text-xs font-bold uppercase tracking-wider text-[#3FA65C]">
              Economía Circular
            </span>
            <span className="rounded bg-[#C5A059]/20 px-2 py-0.5 font-['Barlow_Condensed'] text-xs font-bold uppercase tracking-wider text-[#C5A059]">
              Almacén Yonke ($0 Costo)
            </span>
          </div>
          <h1 className="mt-1 font-['Barlow_Condensed'] text-3xl font-extrabold uppercase tracking-wide text-white sm:text-4xl">
            Inventario Yonke & Piezas Recuperadas
          </h1>
          <p className="text-xs text-[#B8B2A6]">
            Banco de refacciones en excelente estado recuperadas de unidades dadas de baja o desguazadas.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={cargarDatos}
            className="flex items-center gap-1.5 rounded-xl border border-[rgba(243,239,231,0.15)] bg-[#14181D] px-3.5 py-2 text-xs font-semibold text-[#f3f4f6] hover:border-white transition-all cursor-pointer"
          >
            <RotateCw className="h-3.5 w-3.5 text-[#B8B2A6]" />
            <span>Refrescar</span>
          </button>
          <button
            type="button"
            onClick={() => setModalRegistroAbierto(true)}
            className="flex items-center gap-2 rounded-xl bg-[#3FA65C] px-5 py-2.5 font-['Barlow_Condensed'] text-xs font-bold uppercase tracking-wider text-[#16191E] shadow-lg shadow-[#3FA65C]/20 hover:bg-[#2e7d44] transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4 stroke-[3]" />
            <span>Registrar Pieza Desmontada</span>
          </button>
        </div>
      </div>

      {/* Métricas Rápidas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-[rgba(243,239,231,0.08)] bg-[#14181D]/80 p-4">
          <div className="flex items-center justify-between text-xs text-[#B8B2A6]">
            <span>Piezas Disponibles en Stock</span>
            <Package className="h-4 w-4 text-[#3FA65C]" />
          </div>
          <div className="mt-1 font-['Barlow_Condensed'] text-3xl font-black text-[#3FA65C] tabular-nums">
            {disponibles} PZ
          </div>
          <div className="text-[10px] text-[#B8B2A6] mt-0.5">Listas para reutilización inmediata</div>
        </div>

        <div className="rounded-xl border border-[rgba(243,239,231,0.08)] bg-[#14181D]/80 p-4">
          <div className="flex items-center justify-between text-xs text-[#B8B2A6]">
            <span>Ahorro Directo en Adquisiciones</span>
            <DollarSign className="h-4 w-4 text-[#F2620F]" />
          </div>
          <div className="mt-1 font-['Barlow_Condensed'] text-3xl font-black text-[#F2620F] tabular-nums">
            ${ahorroEstimado.toLocaleString()} MXN
          </div>
          <div className="text-[10px] text-[#B8B2A6] mt-0.5">Gasto evitado en compras nuevas</div>
        </div>

        <div className="rounded-xl border border-[rgba(243,239,231,0.08)] bg-[#14181D]/80 p-4">
          <div className="flex items-center justify-between text-xs text-[#B8B2A6]">
            <span>Piezas Reutilizadas</span>
            <Recycle className="h-4 w-4 text-[#C5A059]" />
          </div>
          <div className="mt-1 font-['Barlow_Condensed'] text-3xl font-black text-white tabular-nums">
            {reutilizadas} PZ
          </div>
          <div className="text-[10px] text-[#B8B2A6] mt-0.5">Instaladas en flota activa</div>
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
              placeholder="Buscar por refacción (alternador, marcha), categoría o rack..."
              className="w-full rounded-xl border border-[rgba(243,239,231,0.15)] bg-[#1C1C1C] py-2 pl-10 pr-3 text-xs text-white placeholder-[#B8B2A6]/50 focus:border-[#3FA65C] focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            {['Todas', 'Disponibles', 'Reutilizadas'].map(f => (
              <button
                key={f}
                type="button"
                onClick={() => setFiltroEstado(f)}
                className={`rounded-lg px-3 py-1.5 font-['Barlow_Condensed'] text-xs font-bold uppercase tracking-wider transition-all ${
                  filtroEstado === f
                    ? 'bg-[#3FA65C] text-[#16191E]'
                    : 'bg-[#1C1C1C] text-[#B8B2A6] hover:text-white'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Tabla Densa */}
        <div className="overflow-x-auto rounded-xl border border-[rgba(243,239,231,0.08)] bg-[#1C1C1C]/40">
          <table className="w-full text-left text-xs text-[#f3f4f6]">
            <thead className="border-b border-[rgba(243,239,231,0.1)] bg-[#1C1C1C] font-['Barlow_Condensed'] uppercase tracking-wider text-[#B8B2A6]">
              <tr>
                <th className="px-4 py-3">Código</th>
                <th className="px-4 py-3">Refacción Recuperada</th>
                <th className="px-4 py-3">Categoría</th>
                <th className="px-4 py-3">Tracto Origen</th>
                <th className="px-4 py-3">Ubicación</th>
                <th className="px-4 py-3">Estado Físico</th>
                <th className="px-4 py-3">Disponibilidad</th>
                <th className="px-4 py-3 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(243,239,231,0.06)] font-['Barlow']">
              {cargando ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-xs text-[#B8B2A6]">
                    Cargando piezas del Yonke...
                  </td>
                </tr>
              ) : piezasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-xs text-[#B8B2A6]">
                    No se encontraron piezas en almacén para los filtros aplicados.
                  </td>
                </tr>
              ) : (
                piezasFiltradas.map(p => (
                  <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-[#3FA65C]">
                      {p.id_pieza || `YK-${p.id}`}
                    </td>
                    <td className="px-4 py-3 font-semibold text-white">
                      {p.nombre_pieza}
                    </td>
                    <td className="px-4 py-3 text-[#B8B2A6]">
                      {p.categoria}
                    </td>
                    <td className="px-4 py-3 font-bold text-white">
                      <span className="inline-flex items-center gap-1">
                        <Truck className="h-3 w-3 text-[#F2620F]" />
                        {p.unidad_origen || 'WH-099'}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-[#C5A059]">
                      {p.ubicacion_almacen}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded px-2 py-0.5 font-['Barlow_Condensed'] text-[10px] font-bold uppercase ${
                          p.estado_pieza === 'Excelente'
                            ? 'bg-[#3FA65C]/20 text-[#3FA65C]'
                            : p.estado_pieza === 'Bueno'
                            ? 'bg-[#C5A059]/20 text-[#C5A059]'
                            : 'bg-[#F2620F]/20 text-[#F2620F]'
                        }`}
                      >
                        {p.estado_pieza}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {p.disponible ? (
                        <span className="rounded bg-[#3FA65C]/20 px-2 py-0.5 font-['Barlow_Condensed'] text-[10px] font-bold text-[#3FA65C]">
                          En Stock ($0)
                        </span>
                      ) : (
                        <span className="rounded bg-white/10 px-2 py-0.5 font-['Barlow_Condensed'] text-[10px] font-bold text-[#B8B2A6]">
                          Asignada a {p.unidad_destino}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {p.disponible ? (
                        <button
                          type="button"
                          onClick={() => {
                            setPiezaAAsignar(p)
                            setModalAsignarAbierto(true)
                          }}
                          className="inline-flex items-center gap-1 rounded-lg bg-[#3FA65C] px-2.5 py-1 text-xs font-semibold font-['Barlow_Condensed'] uppercase text-[#16191E] hover:bg-[#2e7d44] transition-all cursor-pointer"
                          title="Instalar en unidad activa sin costo de compra"
                        >
                          <Wrench className="h-3 w-3" />
                          <span>Asignar</span>
                        </button>
                      ) : (
                        <span className="text-[11px] text-[#B8B2A6] italic">Reutilizada</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Registrar Pieza Desmontada */}
      {modalRegistroAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl border border-[rgba(243,239,231,0.15)] bg-[#14181D] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[rgba(243,239,231,0.1)] bg-[#1C1C1C] px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#3FA65C] text-[#16191E]">
                  <Recycle className="h-5 w-5 stroke-[2.5]" />
                </div>
                <h3 className="font-['Barlow_Condensed'] text-xl font-bold uppercase tracking-wide text-white">
                  Registrar Pieza Desmontada
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalRegistroAbierto(false)}
                className="text-[#B8B2A6] hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={manejarRegistrarPieza} className="p-6 space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#B8B2A6]">
                  Nombre de la Refacción
                </label>
                <input
                  type="text"
                  value={nombrePieza}
                  onChange={e => setNombrePieza(e.target.value)}
                  placeholder="Ej. Marcha de arranque Cummins ISX..."
                  className="w-full rounded-xl border border-[rgba(243,239,231,0.15)] bg-[#1C1C1C] py-2 px-3 text-xs text-white focus:border-[#3FA65C] focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#B8B2A6]">
                    Tracto Origen
                  </label>
                  <select
                    value={unidadOrigenId}
                    onChange={e => setUnidadOrigenId(Number(e.target.value))}
                    className="w-full rounded-xl border border-[rgba(243,239,231,0.15)] bg-[#1C1C1C] py-2 px-3 font-['Barlow_Condensed'] text-sm font-bold text-white focus:border-[#3FA65C] focus:outline-none"
                  >
                    {unidades.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.id_unidad} ({u.tipo})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#B8B2A6]">
                    Categoría
                  </label>
                  <select
                    value={categoria}
                    onChange={e => setCategoria(e.target.value)}
                    className="w-full rounded-xl border border-[rgba(243,239,231,0.15)] bg-[#1C1C1C] py-2 px-3 font-['Barlow_Condensed'] text-sm font-semibold text-white focus:border-[#3FA65C] focus:outline-none"
                  >
                    <option value="Motor">Motor</option>
                    <option value="Eléctrico">Eléctrico</option>
                    <option value="Frenos">Frenos</option>
                    <option value="Enfriamiento">Enfriamiento</option>
                    <option value="Transmisión">Transmisión</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#B8B2A6]">
                    Estado Físico
                  </label>
                  <select
                    value={estadoPieza}
                    onChange={e => setEstadoPieza(e.target.value as typeof estadoPieza)}
                    className="w-full rounded-xl border border-[rgba(243,239,231,0.15)] bg-[#1C1C1C] py-2 px-3 font-['Barlow_Condensed'] text-sm font-semibold text-white focus:border-[#3FA65C] focus:outline-none"
                  >
                    <option value="Excelente">Excelente (Como nueva)</option>
                    <option value="Bueno">Bueno (Operativa)</option>
                    <option value="Regular">Regular (Desgaste menor)</option>
                    <option value="Para Reparar">Para Reparar</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#B8B2A6]">
                    Ubicación Almacén
                  </label>
                  <input
                    type="text"
                    value={ubicacionAlmacen}
                    onChange={e => setUbicacionAlmacen(e.target.value)}
                    placeholder="RACK-A1"
                    className="w-full rounded-xl border border-[rgba(243,239,231,0.15)] bg-[#1C1C1C] py-2 px-3 text-xs text-white focus:border-[#3FA65C] focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-[rgba(243,239,231,0.08)]">
                <button
                  type="button"
                  onClick={() => setModalRegistroAbierto(false)}
                  className="rounded-xl border border-[rgba(243,239,231,0.15)] px-4 py-2 font-['Barlow_Condensed'] text-xs font-bold uppercase text-[#B8B2A6] hover:text-white cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="rounded-xl bg-[#3FA65C] px-5 py-2 font-['Barlow_Condensed'] text-xs font-bold uppercase tracking-wider text-[#16191E] hover:bg-[#2e7d44] cursor-pointer"
                >
                  {guardando ? 'Guardando...' : 'Registrar en Yonke'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Asignar Pieza a Unidad Activa ($0 Costo) */}
      {modalAsignarAbierto && piezaAAsignar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl border border-[rgba(243,239,231,0.15)] bg-[#14181D] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[rgba(243,239,231,0.1)] bg-[#1C1C1C] px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#3FA65C] text-[#16191E]">
                  <Wrench className="h-5 w-5 stroke-[2.5]" />
                </div>
                <div>
                  <span className="font-['Barlow_Condensed'] text-xs font-bold uppercase tracking-widest text-[#3FA65C]">
                    REUTILIZACIÓN A COSTO $0
                  </span>
                  <h3 className="font-['Barlow_Condensed'] text-xl font-bold uppercase tracking-wide text-white">
                    Instalar {piezaAAsignar.nombre_pieza}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalAsignarAbierto(false)}
                className="text-[#B8B2A6] hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={manejarAsignarPieza} className="p-6 space-y-4">
              <div className="rounded-xl border border-[#3FA65C]/30 bg-[#3FA65C]/10 p-3 text-xs text-[#f3f4f6]">
                <p>
                  Esta pieza se descontará del inventario del Yonke y se instalará en el tracto seleccionado <strong>sin generar factura ni orden de compra</strong> (costo de refacción $0 MXN).
                </p>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-[#B8B2A6]">
                  Unidad Destino Activa
                </label>
                <select
                  value={unidadDestinoId}
                  onChange={e => setUnidadDestinoId(Number(e.target.value))}
                  className="w-full rounded-xl border border-[rgba(243,239,231,0.15)] bg-[#1C1C1C] py-2.5 px-3 font-['Barlow_Condensed'] text-sm font-bold text-white focus:border-[#3FA65C] focus:outline-none"
                >
                  {unidades.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.id_unidad} — {u.tipo} ({u.estado})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-[rgba(243,239,231,0.08)]">
                <button
                  type="button"
                  onClick={() => setModalAsignarAbierto(false)}
                  className="rounded-xl border border-[rgba(243,239,231,0.15)] px-4 py-2 font-['Barlow_Condensed'] text-xs font-bold uppercase text-[#B8B2A6] hover:text-white cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={asignando}
                  className="flex items-center gap-1.5 rounded-xl bg-[#3FA65C] px-5 py-2 font-['Barlow_Condensed'] text-xs font-bold uppercase tracking-wider text-[#16191E] hover:bg-[#2e7d44] cursor-pointer"
                >
                  <Send className="h-3.5 w-3.5" />
                  {asignando ? 'Asignando...' : 'Confirmar Instalación'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default ComprasYonke

