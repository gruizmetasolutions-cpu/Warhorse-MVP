import { useCallback, useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import Camion from '../components/Camion'
import Kicker from '../components/Kicker'
import { SortTh, TablaFooter, TablaToolbar } from '../components/TablaControls'
import { ApiError, actualizarUnidad, crearUnidad, getArticulosAlmacen, actualizarArticuloAlmacen, crearArticuloAlmacen, type UnidadApi, type ArticuloAlmacenApi } from '../lib/api'
import { useDemo } from '../lib/demo'
import { badge, card, estadoUnidadColors, FD, fmt, h2Titulo, h3Titulo, subTitulo, tdCell, thCell, theadRow } from '../lib/estilos'
import { useTabla } from '../lib/useTabla'
import type { EstadoUnidad, TipoUnidad } from '../lib/types'

type FiltroEstado = 'Todos' | EstadoUnidad
type FiltroTipo   = 'Todos' | TipoUnidad

const campo: CSSProperties = { padding: 12, border: '1px solid #D8D2C4', borderRadius: 9, fontSize: 15, background: '#FAF7F0', width: '100%' }
const etiqueta: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 6, fontSize: 14, fontWeight: 600 }

interface Alta {
  id_unidad: string
  tipo: TipoUnidad
  estado: EstadoUnidad
  fecha_alta: string
  valor_referencia: string
  vencimiento_documentacion: string
  vin: string
  numero_economico: string
  marca: string
  modelo: string
  placas: string
}

const altaVacia: Alta = { id_unidad: '', tipo: 'Tractor', estado: 'Activo', fecha_alta: '', valor_referencia: '', vencimiento_documentacion: '', vin: '', numero_economico: '', marca: '', modelo: '', placas: '' }

interface NuevoArticulo {
  nombre_normalizado: string
  numero_parte: string
  precio_referencia: string
  stock_minimo: string
  stock_maximo: string
  stock_actual: string
  validar_limites: boolean
}

const articuloVacio: NuevoArticulo = {
  nombre_normalizado: '',
  numero_parte: '',
  precio_referencia: '',
  stock_minimo: '',
  stock_maximo: '',
  stock_actual: '',
  validar_limites: false,
}

const TIPOS: FiltroTipo[] = ['Todos', 'Tractor', 'Caja', 'Thermo', 'Servicio']
const ESTADOS: FiltroEstado[] = ['Todos', 'Activo', 'Yonke', 'Inactivo', 'Vendido']

const obtenerColorSemaforo = (fechaStr?: string | null): { bg: string; fg: string; label: string } | null => {
  if (!fechaStr) return null
  const hoy = new Date()
  const vencimiento = new Date(fechaStr)
  const diffTime = vencimiento.getTime() - hoy.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays <= 14) {
    return { bg: '#FBEBE8', fg: '#C53030', label: `Rojo (${diffDays} días)` }
  } else if (diffDays <= 28) {
    return { bg: '#FBF3D9', fg: '#8A6D1A', label: `Amarillo (${diffDays} días)` }
  } else {
    return { bg: '#E5F3E9', fg: '#2C7A44', label: `Verde (${diffDays} días)` }
  }
}

export default function Catalogo() {
  const { sesion, unidades, recargarUnidades, toast } = useDemo()
  const navigate = useNavigate()
  
  // Tab State
  const [tabActiva, setTabActiva] = useState<'flota' | 'almacen'>('flota')
  const [articulos, setArticulos] = useState<ArticuloAlmacenApi[]>([])
  const [cargandoAlmacen, setCargandoAlmacen] = useState(false)
  const [editarArticulo, setEditarArticulo] = useState<{ id: number; nombre: string; stock_minimo: string; stock_maximo: string; stock_actual: string; validar_limites: boolean } | null>(null)
  const [nuevoArticulo, setNuevoArticulo] = useState<NuevoArticulo | null>(null)

  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>('Todos')
  const [filtroTipo, setFiltroTipo]     = useState<FiltroTipo>('Todos')
  const [alta, setAlta]   = useState<Alta | null>(null)
  const [editar, setEditar] = useState<{ unidad: UnidadApi; estado: EstadoUnidad; valor: string; vencimiento_documentacion: string; vin: string; numero_economico: string; marca: string; modelo: string; placas: string } | null>(null)
  const [error, setError] = useState('')
  
  const esAdmin = sesion?.rol === 'admin'
  const esCompras = sesion?.rol === 'compras'

  const filtered = useMemo(
    () =>
      unidades.filter(
        (t) =>
          (filtroEstado === 'Todos' || t.estado === filtroEstado) &&
          (filtroTipo   === 'Todos' || t.tipo   === filtroTipo),
      ),
    [unidades, filtroEstado, filtroTipo],
  )

  const ctrl = useTabla(
    filtered,
    'id_unidad',
    'asc',
    useCallback((row, col) => {
      if (col === 'costo') return row.costo_real_acumulado ?? 0
      return (row as unknown as Record<string, unknown>)[col] as string | number
    }, []),
  )

  const cargarAlmacen = useCallback(async () => {
    setCargandoAlmacen(true)
    try {
      setArticulos(await getArticulosAlmacen())
    } catch (e) {
      toast('No se pudo cargar el inventario de almacén.')
    } finally {
      setCargandoAlmacen(false)
    }
  }, [toast])

  useEffect(() => {
    if (tabActiva === 'almacen') {
      void cargarAlmacen()
    }
  }, [tabActiva, cargarAlmacen])

  const guardarAlta = async () => {
    if (!alta) return
    setError('')
    try {
      await crearUnidad({
        id_unidad: alta.id_unidad.trim(),
        tipo: alta.tipo,
        estado: alta.estado,
        fecha_alta: alta.fecha_alta,
        valor_referencia: alta.valor_referencia === '' ? null : Number(alta.valor_referencia),
        vencimiento_documentacion: alta.vencimiento_documentacion === '' ? null : alta.vencimiento_documentacion,
          vin: alta.vin === '' ? null : alta.vin,
        numero_economico: alta.numero_economico === '' ? null : alta.numero_economico,
        marca: alta.marca === '' ? null : alta.marca,
        modelo: alta.modelo === '' ? null : alta.modelo,
        placas: alta.placas === '' ? null : alta.placas,
      })
      await recargarUnidades()
      toast(`${alta.id_unidad.trim()} dada de alta en la flota`)
      setAlta(null)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No se pudo guardar la unidad.')
    }
  }

  const guardarEdicion = async () => {
    if (!editar) return
    setError('')
    try {
      const cambio: { estado?: EstadoUnidad; valor_referencia?: number; vencimiento_documentacion?: string | null; vin?: string | null; numero_economico?: string | null; marca?: string | null; modelo?: string | null; placas?: string | null } = {}
      if (editar.estado !== editar.unidad.estado) cambio.estado = editar.estado
      if (editar.valor !== '' && Number(editar.valor) !== editar.unidad.valor_referencia) {
        cambio.valor_referencia = Number(editar.valor)
      }
      if (editar.vencimiento_documentacion !== (editar.unidad.vencimiento_documentacion ?? '')) {
        cambio.vencimiento_documentacion = editar.vencimiento_documentacion === '' ? null : editar.vencimiento_documentacion
        }
        if (editar.vin !== (editar.unidad.vin ?? '')) cambio.vin = editar.vin === '' ? null : editar.vin
        if (editar.numero_economico !== (editar.unidad.numero_economico ?? '')) cambio.numero_economico = editar.numero_economico === '' ? null : editar.numero_economico
        if (editar.marca !== (editar.unidad.marca ?? '')) cambio.marca = editar.marca === '' ? null : editar.marca
        if (editar.modelo !== (editar.unidad.modelo ?? '')) cambio.modelo = editar.modelo === '' ? null : editar.modelo
        if (editar.placas !== (editar.unidad.placas ?? '')) cambio.placas = editar.placas === '' ? null : editar.placas

      if (Object.keys(cambio).length > 0) {
        await actualizarUnidad(editar.unidad.id, cambio)
        await recargarUnidades()
        toast(`${editar.unidad.id_unidad} actualizada`)
      }
      setEditar(null)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No se pudo actualizar la unidad.')
    }
  }

  const guardarEdicionArticulo = async () => {
    if (!editarArticulo) return
    setError('')
    try {
      const min = editarArticulo.stock_minimo === '' ? null : Number(editarArticulo.stock_minimo)
      const max = editarArticulo.stock_maximo === '' ? null : Number(editarArticulo.stock_maximo)
      const act = editarArticulo.stock_actual === '' ? 0 : Number(editarArticulo.stock_actual)
      
      if (min !== null && max !== null && min > max) {
        return setError('El stock mínimo no puede ser mayor que el stock máximo.')
      }

      await actualizarArticuloAlmacen(editarArticulo.id, {
        stock_minimo: min,
        stock_maximo: max,
        stock_actual: act,
        validar_limites: editarArticulo.validar_limites,
      })
      await cargarAlmacen()
      toast(`${editarArticulo.nombre} configurado correctamente`)
      setEditarArticulo(null)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No se pudo configurar el inventario.')
    }
  }

  const guardarNuevoArticulo = async () => {
    if (!nuevoArticulo) return
    setError('')
    try {
      const min = nuevoArticulo.stock_minimo === '' ? null : Number(nuevoArticulo.stock_minimo)
      const max = nuevoArticulo.stock_maximo === '' ? null : Number(nuevoArticulo.stock_maximo)
      const act = nuevoArticulo.stock_actual === '' ? 0 : Number(nuevoArticulo.stock_actual)
      const ref = Number(nuevoArticulo.precio_referencia)

      if (isNaN(ref) || ref <= 0) {
        return setError('El precio de referencia debe ser mayor a 0.')
      }
      if (min !== null && max !== null && min > max) {
        return setError('El stock mínimo no puede ser mayor que el stock máximo.')
      }

      await crearArticuloAlmacen({
        nombre_normalizado: nuevoArticulo.nombre_normalizado.trim(),
        numero_parte: nuevoArticulo.numero_parte.trim() === '' ? null : nuevoArticulo.numero_parte.trim(),
        precio_referencia: ref,
        stock_minimo: min,
        stock_maximo: max,
        stock_actual: act,
        validar_limites: nuevoArticulo.validar_limites,
      })
      await cargarAlmacen()
      toast(`Artículo "${nuevoArticulo.nombre_normalizado}" agregado al catálogo`)
      setNuevoArticulo(null)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No se pudo crear el artículo.')
    }
  }

  const modal = (titulo: string, contenido: ReactNode, onGuardar: () => void, onCerrar: () => void) => (
    <div
      onClick={onCerrar}
      style={{ position: 'fixed', inset: 0, background: 'rgba(20,24,29,0.55)', zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        style={{ background: '#fff', borderRadius: 14, maxWidth: 480, width: '100%', padding: 26, boxShadow: '0 20px 60px rgba(0,0,0,0.35)', borderTop: '5px solid #F2620F', animation: 'fadeUp 0.2s ease' }}
      >
        <h3 style={{ fontFamily: FD, fontWeight: 700, fontSize: 22, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#16191E', margin: '0 0 14px' }}>
          {titulo}
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>{contenido}</div>
        {error && (
          <div role="alert" style={{ marginTop: 12, background: '#FBEBE8', border: '1px solid #E8A99D', color: '#9B2C2C', borderRadius: 9, padding: '12px 14px', fontSize: 14 }}>
            {error}
          </div>
        )}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
          <button
            onClick={onCerrar}
            className="hv-crema"
            style={{ padding: '10px 18px', background: '#fff', border: '1px solid #D8D2C4', borderRadius: 8, fontSize: 14, fontWeight: 700, color: '#16191E', cursor: 'pointer' }}
          >
            Cancelar
          </button>
          <button
            onClick={onGuardar}
            className="hv-naranja"
            style={{ padding: '10px 20px', background: '#F2620F', border: 'none', borderRadius: 8, fontFamily: FD, fontSize: 16, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#fff', cursor: 'pointer' }}
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap', animation: 'fadeUp 0.35s ease' }}>
        <div>
          <Kicker texto="Catálogos" />
          <h2 style={h2Titulo}>Gestión de Catálogos</h2>
          <p style={subTitulo}>
            Administración centralizada de la flota de unidades y existencias límites del almacén general.
          </p>
        </div>
      </div>

      {/* Tabs navigation */}
      <div style={{ display: 'flex', gap: 10, borderBottom: '1px solid #D8D2C4', paddingBottom: 0, marginTop: 12, marginBottom: 18, animation: 'fadeUp 0.38s ease' }}>
        <button
          onClick={() => setTabActiva('flota')}
          className="hv-op85"
          style={{
            padding: '12px 18px', background: 'transparent', border: 'none',
            borderBottom: tabActiva === 'flota' ? '3px solid #F2620F' : '3px solid transparent',
            color: tabActiva === 'flota' ? '#F2620F' : '#6F6A60', fontWeight: 700, fontSize: 14.5, cursor: 'pointer',
            transition: 'all 0.2s ease', textTransform: 'uppercase', letterSpacing: '0.04em', fontFamily: FD
          }}
        >
          🚚 Flota de Unidades
        </button>
        <button
          onClick={() => setTabActiva('almacen')}
          className="hv-op85"
          style={{
            padding: '12px 18px', background: 'transparent', border: 'none',
            borderBottom: tabActiva === 'almacen' ? '3px solid #F2620F' : '3px solid transparent',
            color: tabActiva === 'almacen' ? '#F2620F' : '#6F6A60', fontWeight: 700, fontSize: 14.5, cursor: 'pointer',
            transition: 'all 0.2s ease', textTransform: 'uppercase', letterSpacing: '0.04em', fontFamily: FD
          }}
        >
          📦 Inventario de Almacén
        </button>
      </div>

      {tabActiva === 'flota' ? (
        <div data-tour="catalogo" style={{ ...card, padding: '14px 20px', overflowX: 'auto', animation: 'fadeUp 0.4s ease' }}>
          <TablaToolbar
            ctrl={ctrl}
            filtros={ESTADOS.map((f) => ({ value: f }))}
            filtroActivo={filtroEstado}
            onFiltro={(f) => setFiltroEstado(f as FiltroEstado)}
            rightSlot={
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {TIPOS.filter(t => t !== 'Todos').map((t) => (
                  <button
                    key={t}
                    onClick={() => { setFiltroTipo(filtroTipo === t ? 'Todos' : t); ctrl.resetPage() }}
                    className="hv-borde-ink"
                    style={{
                      padding: '7px 12px',
                      borderRadius: 8,
                      fontSize: 12.5,
                      fontWeight: 700,
                      cursor: 'pointer',
                      background: filtroTipo === t ? '#F2620F' : '#fff',
                      color: filtroTipo === t ? '#fff' : '#4A4438',
                      border: filtroTipo === t ? '1px solid #F2620F' : '1px solid #D8D2C4',
                    }}
                  >
                    {t === 'Servicio' ? 'Servicio' : t}
                  </button>
                ))}
                {esAdmin && (
                  <button
                    onClick={() => { setError(''); setAlta({ ...altaVacia }) }}
                    className="hv-naranja"
                    style={{ padding: '9px 18px', background: '#F2620F', color: '#fff', border: 'none', borderRadius: 8, fontFamily: FD, fontWeight: 700, fontSize: 15, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer' }}
                  >
                    + Agregar unidad
                  </button>
                )}
              </div>
            }
          />

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, minWidth: 560 }}>
            <thead>
              <tr style={theadRow}>
                <SortTh col="id_unidad" label="ID Unidad"               sortCol={ctrl.sortCol} sortDir={ctrl.sortDir} onSort={ctrl.toggleSort} />
                  <SortTh col="vin" label="VIN / Económico" sortCol={ctrl.sortCol} sortDir={ctrl.sortDir} onSort={ctrl.toggleSort} />
                  <SortTh col="marca" label="Vehículo" sortCol={ctrl.sortCol} sortDir={ctrl.sortDir} onSort={ctrl.toggleSort} />
                  <SortTh col="placas" label="Placas" sortCol={ctrl.sortCol} sortDir={ctrl.sortDir} onSort={ctrl.toggleSort} />
                <SortTh col="tipo"      label="Tipo"                sortCol={ctrl.sortCol} sortDir={ctrl.sortDir} onSort={ctrl.toggleSort} />
                <SortTh col="estado"    label="Estado"              sortCol={ctrl.sortCol} sortDir={ctrl.sortDir} onSort={ctrl.toggleSort} />
                <SortTh col="vencimiento" label="Vigencia Trámites" sortCol={ctrl.sortCol} sortDir={ctrl.sortDir} onSort={ctrl.toggleSort} />
                <SortTh col="costo"     label="Costo total acumulado" sortCol={ctrl.sortCol} sortDir={ctrl.sortDir} onSort={ctrl.toggleSort} style={{ textAlign: 'right' }} />
                <th style={{ padding: '12px 10px', borderBottom: '2px solid #16191E' }} />
              </tr>
            </thead>
            <tbody>
              {ctrl.filasPagina.map((t) => {
                const c = estadoUnidadColors[t.estado] ?? estadoUnidadColors.Activo
                const semaforo = obtenerColorSemaforo(t.vencimiento_documentacion)
                return (
                  <tr key={t.id} className="hv-fila">
                    <td style={{ ...tdCell, fontFamily: FD, fontWeight: 700, fontSize: 17, color: '#16191E' }}>{t.id_unidad}</td>
                    <td style={tdCell}>{t.tipo === 'Servicio' ? 'Camioneta de servicio' : t.tipo}</td>
                    <td style={tdCell}>
                      <span style={badge(c[0], c[1], c[2])}>{t.estado}</span>
                    </td>
                    <td style={tdCell}>
                      {semaforo ? (
                        <span style={badge(semaforo.bg, semaforo.fg)} title={t.vencimiento_documentacion ?? ''}>
                          🚦 {semaforo.label}
                        </span>
                      ) : (
                        <span style={{ color: '#8A8374', fontSize: 13 }}>—</span>
                      )}
                    </td>
                    <td style={{ ...tdCell, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                      {t.costo_real_acumulado ? fmt(t.costo_real_acumulado) : '—'}
                    </td>
                    <td style={{ ...tdCell, textAlign: 'right', whiteSpace: 'nowrap' }}>
                      {esAdmin && (
                        <button
                          onClick={() => { setError(''); setEditar({ unidad: t, estado: t.estado, valor: t.valor_referencia === null ? '' : String(t.valor_referencia), vencimiento_documentacion: t.vencimiento_documentacion ?? '', vin: t.vin ?? '', numero_economico: t.numero_economico ?? '', marca: t.marca ?? '', modelo: t.modelo ?? '', placas: t.placas ?? '' }) }}
                          className="hv-inkfill"
                          style={{ padding: '7px 12px', background: '#F3EFE7', border: '1px solid #D8D2C4', borderRadius: 7, fontSize: 12.5, fontWeight: 700, color: '#16191E', cursor: 'pointer', marginRight: 8 }}
                        >
                          Editar
                        </button>
                      )}
                      <button
                        onClick={() => navigate('/ficha/' + t.id_unidad)}
                        className="hv-inkfill"
                        style={{ padding: '7px 12px', background: '#F3EFE7', border: '1px solid #D8D2C4', borderRadius: 7, fontSize: 12.5, fontWeight: 700, color: '#16191E', cursor: 'pointer' }}
                      >
                        Ver ficha
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {ctrl.total === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: 30, color: '#6F6A60', fontSize: 14 }}>
              <Camion stroke="#16191E" strokeWidth={3} style={{ width: 120, opacity: 0.35 }} />
              Aún no hay unidades en esta vista.
            </div>
          )}

          <TablaFooter ctrl={ctrl} />
        </div>
      ) : (
        <div style={{ ...card, padding: '14px 20px', overflowX: 'auto', animation: 'fadeUp 0.4s ease' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, borderBottom: '1px solid #EFEAE0', paddingBottom: 10 }}>
            <h3 style={h3Titulo}>Catálogo de Artículos y Existencias Límites</h3>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: '#8A8374', fontWeight: 600 }}>{articulos.length} artículos en almacén</span>
              {(esAdmin || esCompras) && (
                <button
                  onClick={() => { setError(''); setNuevoArticulo({ ...articuloVacio }) }}
                  className="hv-naranja"
                  style={{ padding: '7px 14px', background: '#F2620F', color: '#fff', border: 'none', borderRadius: 8, fontFamily: FD, fontWeight: 700, fontSize: 14, letterSpacing: '0.04em', textTransform: 'uppercase', cursor: 'pointer' }}
                >
                  + Agregar producto
                </button>
              )}
            </div>
          </div>

          {cargandoAlmacen ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#6F6A60', fontSize: 15 }}>
              Cargando catálogo de almacén...
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, minWidth: 640 }}>
              <thead>
                <tr style={theadRow}>
                  <th style={thCell}>Artículo</th>
                  <th style={thCell}>Número de Parte</th>
                  <th style={{ ...thCell, textAlign: 'right' }}>Precio de Referencia</th>
                  <th style={{ ...thCell, textAlign: 'right' }}>Stock Actual</th>
                  <th style={{ ...thCell, textAlign: 'right' }}>Mín. Existencias</th>
                  <th style={{ ...thCell, textAlign: 'right' }}>Máx. Existencias</th>
                  <th style={{ ...thCell, textAlign: 'center' }}>Validar Alerta</th>
                  <th style={{ ...thCell, padding: '12px 10px', borderBottom: '2px solid #16191E' }} />
                </tr>
              </thead>
              <tbody>
                {articulos.map((art) => (
                  <tr key={art.id} className="hv-fila">
                    <td style={{ ...tdCell, fontWeight: 600, color: '#16191E' }}>{art.nombre_normalizado}</td>
                    <td style={tdCell}>{art.numero_parte ?? '—'}</td>
                    <td style={{ ...tdCell, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                      {art.precio_referencia ? fmt(art.precio_referencia) : '—'}
                    </td>
                    <td style={{ ...tdCell, textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 700 }}>
                      {art.stock_actual}
                    </td>
                    <td style={{ ...tdCell, textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 700, color: '#B4430A' }}>
                      {art.stock_minimo ?? '—'}
                    </td>
                    <td style={{ ...tdCell, textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 700, color: '#2C7A44' }}>
                      {art.stock_maximo ?? '—'}
                    </td>
                    <td style={{ ...tdCell, textAlign: 'center' }}>
                      {art.validar_limites ? (
                        <span style={badge('#E5F3E9', '#2C7A44', '#9FD4B0')}>Sí</span>
                      ) : (
                        <span style={badge('#EAE6DC', '#4A4438', '#C9C2B2')}>No</span>
                      )}
                    </td>
                    <td style={{ ...tdCell, textAlign: 'right', whiteSpace: 'nowrap' }}>
                      {(esAdmin || esCompras) && (
                        <button
                          onClick={() => {
                            setError('')
                            setEditarArticulo({
                              id: art.id,
                              nombre: art.nombre_normalizado,
                              stock_minimo: art.stock_minimo === null ? '' : String(art.stock_minimo),
                              stock_maximo: art.stock_maximo === null ? '' : String(art.stock_maximo),
                              stock_actual: String(art.stock_actual),
                              validar_limites: !!art.validar_limites,
                            })
                          }}
                          className="hv-inkfill"
                          style={{ padding: '7px 12px', background: '#F3EFE7', border: '1px solid #D8D2C4', borderRadius: 7, fontSize: 12.5, fontWeight: 700, color: '#16191E', cursor: 'pointer' }}
                        >
                          Configurar Mín/Máx
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Modals */}
      {alta &&
        modal(
          'Agregar unidad',
          <>
            <label style={etiqueta}>
              ID de la unidad
              <input style={campo} value={alta.id_unidad} placeholder="Ej. WH130" onChange={(e) => setAlta({ ...alta, id_unidad: e.target.value })} />
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <label style={etiqueta}>
                Tipo
                <select style={campo} value={alta.tipo} onChange={(e) => setAlta({ ...alta, tipo: e.target.value as TipoUnidad })}>
                  <option value="Tractor">Tractor</option>
                  <option value="Caja">Caja</option>
                  <option value="Thermo">Thermo</option>
                  <option value="Servicio">Camioneta de servicio</option>
                </select>
              </label>
              <label style={etiqueta}>
                Estado
                <select style={campo} value={alta.estado} onChange={(e) => setAlta({ ...alta, estado: e.target.value as EstadoUnidad })}>
                  <option value="Activo">Activo</option>
                  <option value="Yonke">Yonke</option>
                  <option value="Inactivo">Inactivo</option>
                  <option value="Vendido">Vendido</option>
                </select>
              </label>
            </div>
            <label style={etiqueta}>
              Fecha de alta
              <input type="date" style={campo} value={alta.fecha_alta} onChange={(e) => setAlta({ ...alta, fecha_alta: e.target.value })} />
            </label>
            <label style={etiqueta}>
                Vencimiento Documentos (Placas/Vigencia)
                <input type="date" style={campo} value={alta.vencimiento_documentacion} onChange={(e) => setAlta({ ...alta, vencimiento_documentacion: e.target.value })} />
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <label style={etiqueta}>
                  VIN
                  <input type="text" style={campo} value={alta.vin} onChange={(e) => setAlta({ ...alta, vin: e.target.value })} />
                </label>
                <label style={etiqueta}>
                  Número Económico
                  <input type="text" style={campo} value={alta.numero_economico} onChange={(e) => setAlta({ ...alta, numero_economico: e.target.value })} />
                </label>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
                <label style={etiqueta}>
                  Marca
                  <input type="text" style={campo} value={alta.marca} onChange={(e) => setAlta({ ...alta, marca: e.target.value })} />
                </label>
                <label style={etiqueta}>
                  Modelo
                  <input type="text" style={campo} value={alta.modelo} onChange={(e) => setAlta({ ...alta, modelo: e.target.value })} />
                </label>
                <label style={etiqueta}>
                  Placas
                  <input type="text" style={campo} value={alta.placas} onChange={(e) => setAlta({ ...alta, placas: e.target.value })} />
                </label>
              </div>

            <label style={etiqueta}>
              Valor de referencia (MXN)
              <input type="number" min={0} placeholder="Opcional; sin él el veredicto queda pendiente" style={campo} value={alta.valor_referencia} onChange={(e) => setAlta({ ...alta, valor_referencia: e.target.value })} />
            </label>
          </>,
          () => void guardarAlta(),
          () => setAlta(null),
        )}

      {editar &&
        modal(
          'Editar ' + editar.unidad.id_unidad,
          <>
            <label style={etiqueta}>
              Estado
              <select style={campo} value={editar.estado} onChange={(e) => setEditar({ ...editar, estado: e.target.value as EstadoUnidad })}>
                <option value="Activo">Activo</option>
                <option value="Yonke">Yonke</option>
                <option value="Inactivo">Inactivo</option>
                <option value="Vendido">Vendido</option>
              </select>
            </label>
            <label style={etiqueta}>
                Vencimiento Documentos (Placas/Vigencia)
                <input type="date" style={campo} value={editar.vencimiento_documentacion} onChange={(e) => setEditar({ ...editar, vencimiento_documentacion: e.target.value })} />
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <label style={etiqueta}>
                  VIN
                  <input type="text" style={campo} value={editar.vin || ''} onChange={(e) => setEditar({ ...editar, vin: e.target.value })} />
                </label>
                <label style={etiqueta}>
                  Número Económico
                  <input type="text" style={campo} value={editar.numero_economico || ''} onChange={(e) => setEditar({ ...editar, numero_economico: e.target.value })} />
                </label>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
                <label style={etiqueta}>
                  Marca
                  <input type="text" style={campo} value={editar.marca || ''} onChange={(e) => setEditar({ ...editar, marca: e.target.value })} />
                </label>
                <label style={etiqueta}>
                  Modelo
                  <input type="text" style={campo} value={editar.modelo || ''} onChange={(e) => setEditar({ ...editar, modelo: e.target.value })} />
                </label>
                <label style={etiqueta}>
                  Placas
                  <input type="text" style={campo} value={editar.placas || ''} onChange={(e) => setEditar({ ...editar, placas: e.target.value })} />
                </label>
              </div>

            <label style={etiqueta}>
              Valor de referencia (MXN)
              <input type="number" min={0} style={campo} value={editar.valor} onChange={(e) => setEditar({ ...editar, valor: e.target.value })} />
            </label>
          </>,
          () => void guardarEdicion(),
          () => setEditar(null),
        )}

      {editarArticulo &&
        modal(
          'Limites de existencias para: ' + editarArticulo.nombre,
          <>
            <label style={etiqueta}>
              Stock Actual
              <input type="number" min={0} placeholder="Ej. 12" style={campo} value={editarArticulo.stock_actual} onChange={(e) => setEditarArticulo({ ...editarArticulo, stock_actual: e.target.value })} />
            </label>
            <label style={etiqueta}>
              Stock Mínimo
              <input type="number" min={0} placeholder="Ej. 5" style={campo} value={editarArticulo.stock_minimo} onChange={(e) => setEditarArticulo({ ...editarArticulo, stock_minimo: e.target.value })} />
            </label>
            <label style={etiqueta}>
              Stock Máximo
              <input type="number" min={0} placeholder="Ej. 20" style={campo} value={editarArticulo.stock_maximo} onChange={(e) => setEditarArticulo({ ...editarArticulo, stock_maximo: e.target.value })} />
            </label>
            <label style={{ ...etiqueta, flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6 }}>
              <input type="checkbox" checked={editarArticulo.validar_limites} onChange={(e) => setEditarArticulo({ ...editarArticulo, validar_limites: e.target.checked })} />
              Activar alertas de máximos y mínimos para este producto
            </label>
          </>,
          () => void guardarEdicionArticulo(),
          () => setEditarArticulo(null),
        )}

      {nuevoArticulo &&
        modal(
          'Agregar Producto al Catálogo',
          <>
            <label style={etiqueta}>
              Nombre del Artículo
              <input style={campo} value={nuevoArticulo.nombre_normalizado} placeholder="Ej. Conexión rápida 1/2" onChange={(e) => setNuevoArticulo({ ...nuevoArticulo, nombre_normalizado: e.target.value })} />
            </label>
            <label style={etiqueta}>
              Número de Parte / SKU
              <input style={campo} value={nuevoArticulo.numero_parte} placeholder="Opcional" onChange={(e) => setNuevoArticulo({ ...nuevoArticulo, numero_parte: e.target.value })} />
            </label>
            <label style={etiqueta}>
              Precio de Referencia (MXN)
              <input type="number" min={0.01} step="0.01" style={campo} value={nuevoArticulo.precio_referencia} placeholder="Ej. 450.00" onChange={(e) => setNuevoArticulo({ ...nuevoArticulo, precio_referencia: e.target.value })} />
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <label style={etiqueta}>
                Stock Actual
                <input type="number" min={0} style={campo} value={nuevoArticulo.stock_actual} placeholder="Ej. 10" onChange={(e) => setNuevoArticulo({ ...nuevoArticulo, stock_actual: e.target.value })} />
              </label>
              <label style={etiqueta}>
                Stock Mínimo
                <input type="number" min={0} style={campo} value={nuevoArticulo.stock_minimo} placeholder="Ej. 2" onChange={(e) => setNuevoArticulo({ ...nuevoArticulo, stock_minimo: e.target.value })} />
              </label>
            </div>
            <label style={etiqueta}>
              Stock Máximo
              <input type="number" min={0} style={campo} value={nuevoArticulo.stock_maximo} placeholder="Ej. 15" onChange={(e) => setNuevoArticulo({ ...nuevoArticulo, stock_maximo: e.target.value })} />
            </label>
            <label style={{ ...etiqueta, flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6 }}>
              <input type="checkbox" checked={nuevoArticulo.validar_limites} onChange={(e) => setNuevoArticulo({ ...nuevoArticulo, validar_limites: e.target.checked })} />
              Activar alertas de máximos y mínimos para este producto
            </label>
          </>,
          () => void guardarNuevoArticulo(),
          () => setNuevoArticulo(null),
        )}
    </>
  )
}
