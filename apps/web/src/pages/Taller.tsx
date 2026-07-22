import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react'
import Kicker from '../components/Kicker'
import { SortTh, TablaFooter, TablaToolbar } from '../components/TablaControls'
import { ApiError, getTaller, liberarUnidad, registrarIngreso, type RegistroTallerApi } from '../lib/api'
import { useDemo } from '../lib/demo'
import { badge, card, critStyle, FD, fmt, h2Titulo, h3Titulo, subTitulo, tdCell, theadRow, urgColors } from '../lib/estilos'
import { useTabla } from '../lib/useTabla'

const campo: CSSProperties = { padding: 12, border: '1px solid #D8D2C4', borderRadius: 9, fontSize: 15, background: '#FAF7F0', width: '100%' }
const etiqueta: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 6, fontSize: 14, fontWeight: 600 }

type Criticidad = 'Rápida' | 'Media' | 'Crítico'
const criticidades: Criticidad[] = ['Rápida', 'Media', 'Crítico']

type FiltroCrit = 'Todos' | Criticidad
type FiltroLib  = 'Todos' | 'Total' | 'Mejoralito'

export default function Taller() {
  const { unidades, toast } = useDemo()
  const [registros, setRegistros] = useState<RegistroTallerApi[]>([])
  const [unidadId, setUnidadId]   = useState('')
  const [fechaIngreso, setFechaIngreso] = useState('')
  const [diagnostico, setDiagnostico]  = useState('')
  const [criticidad, setCriticidad]    = useState<Criticidad>('Media')
  const [error, setError] = useState('')
  const [liberar, setLiberar]     = useState<RegistroTallerApi | null>(null)
  const [tipo, setTipo]           = useState<'Total' | 'Parcial'>('Total')
  const [fechaSalida, setFechaSalida] = useState('')
  const [costo, setCosto]         = useState('')
  const [pendientes, setPendientes] = useState('')
  const [errorModal, setErrorModal] = useState('')

  // historial filters
  const [filtroCrit, setFiltroCrit] = useState<FiltroCrit>('Todos')
  const [filtroLib,  setFiltroLib]  = useState<FiltroLib>('Todos')
  const [busqueda,   setBusqueda]   = useState('')

  const cargar = useCallback(async () => {
    setRegistros(await getTaller())
  }, [])

  useEffect(() => { void cargar() }, [cargar])

  const enTaller  = useMemo(() => registros.filter((r) => r.tipo_liberacion === null), [registros])
  const historialBase = useMemo(() => registros.filter((r) => r.tipo_liberacion !== null), [registros])

  const historialFiltrado = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    return historialBase.filter((r) => {
      if (filtroCrit !== 'Todos' && r.criticidad !== filtroCrit) return false
      if (filtroLib !== 'Todos') {
        const lib = r.tipo_liberacion === 'Total' ? 'Total' : 'Mejoralito'
        if (lib !== filtroLib) return false
      }
      if (q && !r.id_unidad.toLowerCase().includes(q) && !r.diagnostico.toLowerCase().includes(q)) return false
      return true
    })
  }, [historialBase, filtroCrit, filtroLib, busqueda])

  const ctrlHistorial = useTabla(
    historialFiltrado,
    'fecha_ingreso',
    'desc',
    useCallback((row, col) => {
      if (col === 'dias') return row.dias_en_taller ?? 0
      if (col === 'costo') return Number(row.costo_taller) ?? 0
      return (row as unknown as Record<string, unknown>)[col] as string | number
    }, []),
  )

  const ingresar = async () => {
    setError('')
    if (!unidadId)        return setError('Selecciona la unidad que ingresa a taller.')
    if (!fechaIngreso)    return setError('Captura la fecha de ingreso.')
    
    // Future date validation client-side
    const selectedDate = new Date(fechaIngreso + 'T00:00:00')
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (selectedDate > today) {
      return setError('La fecha de ingreso no puede ser mayor a la fecha actual.')
    }

    if (!diagnostico.trim()) return setError('Describe el diagnóstico principal.')
    try {
      await registrarIngreso({
        unidad_id: Number(unidadId),
        fecha_ingreso: fechaIngreso,
        diagnostico: diagnostico.trim(),
        criticidad,
      })
      setUnidadId(''); setFechaIngreso(''); setDiagnostico(''); setCriticidad('Media')
      toast('Ingreso registrado — la unidad queda En Taller.')
      await cargar()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No se pudo registrar el ingreso.')
    }
  }

  const confirmarLiberacion = async () => {
    if (!liberar) return
    setErrorModal('')
    const lista = pendientes.split('\n').map((p) => p.trim()).filter((p) => p !== '')
    if (tipo === 'Parcial' && lista.length === 0) {
      return setErrorModal('Una liberación parcial exige al menos un pendiente.')
    }
    try {
      await liberarUnidad(liberar.id, {
        tipo_liberacion: tipo,
        fecha_salida: fechaSalida,
        costo_taller: costo === '' ? 0 : Number(costo),
        ...(tipo === 'Parcial' ? { pendientes: lista } : {}),
      })
      toast(
        tipo === 'Total'
          ? `${liberar.id_unidad} liberada al 100%.`
          : `${liberar.id_unidad} liberada como mejoralito — se generó alerta de deuda técnica.`,
      )
      setLiberar(null)
      await cargar()
    } catch (e) {
      if (e instanceof ApiError) {
        const campos = e.fields ? Object.values(e.fields).flat() : []
        setErrorModal(campos[0] ?? e.message)
      } else {
        setErrorModal('No se pudo liberar la unidad.')
      }
    }
  }

  return (
    <>
      <div style={{ animation: 'fadeUp 0.35s ease' }}>
        <Kicker texto="Piso de taller" />
        <h2 style={h2Titulo}>Control de Taller</h2>
        <p style={subTitulo}>
          Ingresos, diagnóstico y liberación. Una liberación parcial (mejoralito) genera alerta de deuda
          técnica y marca la unidad como candidata a reincidencia.
        </p>
      </div>

      {/* ── Registrar ingreso ── */}
      <div data-tour="taller" style={{ ...card, animation: 'fadeUp 0.4s ease' }}>
        <h3 style={{ ...h3Titulo, margin: '0 0 14px' }}>Registrar ingreso</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, alignItems: 'end' }}>
          <label style={etiqueta}>
            Unidad
            <select style={campo} value={unidadId} onChange={(e) => { setUnidadId(e.target.value); setError('') }}>
              <option value="">Selecciona unidad…</option>
              {unidades
                .filter((u) => u.estado === 'Activo')
                .map((u) => (
                  <option key={u.id} value={String(u.id)}>{u.id_unidad + ' · ' + u.tipo}</option>
                ))}
            </select>
          </label>
          <label style={etiqueta}>
            Fecha de ingreso
            <input type="date" style={campo} value={fechaIngreso} onChange={(e) => { setFechaIngreso(e.target.value); setError('') }} />
          </label>
          <label style={etiqueta}>
            Diagnóstico principal
            <input type="text" style={campo} placeholder="Ej. Pasa aceite al turbo" value={diagnostico} onChange={(e) => { setDiagnostico(e.target.value); setError('') }} />
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 14, fontWeight: 600 }}>Criticidad</span>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {criticidades.map((c) => {
                const act = criticidad === c
                const color = urgColors[c === 'Crítico' ? 'Crítica' : c]
                return (
                  <button
                    key={c}
                    onClick={() => setCriticidad(c)}
                    className="hv-op85"
                    style={{
                      padding: '10px 16px', borderRadius: 999, fontSize: 14, fontWeight: 700, cursor: 'pointer',
                      background: act ? color[0] : '#fff', color: act ? color[1] : '#6F6A60',
                      border: act ? '2px solid ' + color[2] : '1px solid #D8D2C4',
                    }}
                  >
                    {c}
                  </button>
                )
              })}
            </div>
          </div>
          <button
            onClick={() => void ingresar()}
            className="hv-naranja"
            style={{ padding: '12px 20px', background: '#F2620F', color: '#fff', border: 'none', borderRadius: 9, fontFamily: FD, fontWeight: 700, fontSize: 16, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer' }}
          >
            Registrar ingreso
          </button>
        </div>
        {error && (
          <div role="alert" style={{ marginTop: 14, background: '#FBEBE8', border: '1px solid #E8A99D', color: '#9B2C2C', borderRadius: 9, padding: '12px 14px', fontSize: 14 }}>
            {error}
          </div>
        )}
      </div>

      {/* ── En taller ahora ── */}
      <div style={{ ...card, padding: '6px 20px 14px', overflowX: 'auto', animation: 'fadeUp 0.45s ease' }}>
        <h3 style={{ ...h3Titulo, margin: '14px 0' }}>En taller ahora</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, minWidth: 640 }}>
          <thead>
            <tr style={theadRow}>
              <th style={{ padding: '12px 10px', borderBottom: '2px solid #16191E' }}>Unidad</th>
              <th style={{ padding: '12px 10px', borderBottom: '2px solid #16191E' }}>Ingreso</th>
              <th style={{ padding: '12px 10px', borderBottom: '2px solid #16191E' }}>Diagnóstico</th>
              <th style={{ padding: '12px 10px', borderBottom: '2px solid #16191E' }}>Criticidad</th>
              <th style={{ padding: '12px 10px', borderBottom: '2px solid #16191E' }} />
            </tr>
          </thead>
          <tbody>
            {enTaller.map((r) => (
              <tr key={r.id} className="hv-fila">
                <td style={{ ...tdCell, fontFamily: FD, fontWeight: 700, fontSize: 17 }}>{r.id_unidad}</td>
                <td style={{ ...tdCell, whiteSpace: 'nowrap' }}>{r.fecha_ingreso}</td>
                <td style={{ ...tdCell, fontWeight: 600 }}>
                  {r.diagnostico}
                  {Boolean(r.es_reincidencia) && (
                    <span style={{ marginLeft: 8 }}>
                      <span style={badge('#FDE8DC', '#B4430A', '#F2620F')}>Reincidencia</span>
                    </span>
                  )}
                </td>
                <td style={tdCell}>
                  <span style={critStyle(r.criticidad)}>{r.criticidad}</span>
                </td>
                <td style={{ ...tdCell, textAlign: 'right' }}>
                  <button
                    onClick={() => {
                      setErrorModal(''); setTipo('Total'); setFechaSalida(''); setCosto(''); setPendientes('')
                      setLiberar(r)
                    }}
                    className="hv-inkfill"
                    style={{ padding: '7px 12px', background: '#F3EFE7', border: '1px solid #D8D2C4', borderRadius: 7, fontSize: 12.5, fontWeight: 700, color: '#16191E', cursor: 'pointer' }}
                  >
                    Liberar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {enTaller.length === 0 && (
          <div style={{ textAlign: 'center', padding: 24, color: '#6F6A60', fontSize: 14 }}>
            No hay unidades en taller ahora mismo.
          </div>
        )}
      </div>

      {/* ── Historial de liberaciones ── */}
      <div style={{ ...card, padding: '14px 20px', overflowX: 'auto', animation: 'fadeUp 0.5s ease' }}>
        <h3 style={{ ...h3Titulo, margin: '0 0 12px' }}>Historial de liberaciones</h3>

        <TablaToolbar
          ctrl={ctrlHistorial}
          filtros={(['Todos', 'Total', 'Mejoralito'] as FiltroLib[]).map((f) => ({ value: f }))}
          filtroActivo={filtroLib}
          onFiltro={(f) => setFiltroLib(f as FiltroLib)}
          busqueda={busqueda}
          onBusqueda={setBusqueda}
          busquedaPlaceholder="Buscar unidad o diagnóstico…"
          rightSlot={
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: '#8A8374', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Criticidad</span>
              {(['Todos', 'Rápida', 'Media', 'Crítico'] as FiltroCrit[]).map((c) => (
                <button
                  key={c}
                  onClick={() => { setFiltroCrit(c); ctrlHistorial.resetPage() }}
                  className="hv-borde-ink"
                  style={{
                    padding: '5px 10px', borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                    background: filtroCrit === c ? '#16191E' : '#fff',
                    color: filtroCrit === c ? '#F3EFE7' : '#4A4438',
                    border: filtroCrit === c ? '1px solid #16191E' : '1px solid #D8D2C4',
                  }}
                >
                  {c}
                </button>
              ))}
            </div>
          }
        />

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, minWidth: 720 }}>
          <thead>
            <tr style={theadRow}>
              <SortTh col="id_unidad"     label="Unidad"       sortCol={ctrlHistorial.sortCol} sortDir={ctrlHistorial.sortDir} onSort={ctrlHistorial.toggleSort} />
              <SortTh col="fecha_ingreso" label="Ingreso"      sortCol={ctrlHistorial.sortCol} sortDir={ctrlHistorial.sortDir} onSort={ctrlHistorial.toggleSort} />
              <SortTh col="diagnostico"   label="Diagnóstico"  sortCol={ctrlHistorial.sortCol} sortDir={ctrlHistorial.sortDir} onSort={ctrlHistorial.toggleSort} />
              <SortTh col="tipo_liberacion" label="Liberación" sortCol={ctrlHistorial.sortCol} sortDir={ctrlHistorial.sortDir} onSort={ctrlHistorial.toggleSort} />
              <SortTh col="dias"          label="Días"         sortCol={ctrlHistorial.sortCol} sortDir={ctrlHistorial.sortDir} onSort={ctrlHistorial.toggleSort} style={{ textAlign: 'right' }} />
              <SortTh col="costo"         label="Costo taller" sortCol={ctrlHistorial.sortCol} sortDir={ctrlHistorial.sortDir} onSort={ctrlHistorial.toggleSort} style={{ textAlign: 'right' }} />
            </tr>
          </thead>
          <tbody>
            {ctrlHistorial.filasPagina.map((r) => (
              <tr key={r.id} className="hv-fila">
                <td style={{ ...tdCell, fontFamily: FD, fontWeight: 700, fontSize: 17 }}>{r.id_unidad}</td>
                <td style={{ ...tdCell, whiteSpace: 'nowrap' }}>{r.fecha_ingreso}</td>
                <td style={{ ...tdCell, fontWeight: 600 }}>
                  {r.diagnostico}
                  {Boolean(r.es_reincidencia) && (
                    <span style={{ marginLeft: 8 }}>
                      <span style={badge('#FDE8DC', '#B4430A', '#F2620F')}>Reincidencia</span>
                    </span>
                  )}
                </td>
                <td style={tdCell}>
                  <span style={r.tipo_liberacion === 'Total' ? badge('#E5F3E9', '#2C7A44', '#9FD4B0') : badge('#FDE8DC', '#B4430A', '#F2620F')}>
                    {r.tipo_liberacion === 'Total' ? 'Total' : 'Mejoralito'}
                  </span>
                </td>
                <td style={{ ...tdCell, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                  {r.dias_en_taller !== null ? r.dias_en_taller + (r.dias_en_taller === 1 ? ' día' : ' días') : '—'}
                </td>
                <td style={{ ...tdCell, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{fmt(Number(r.costo_taller))}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {ctrlHistorial.total === 0 && (
          <div style={{ textAlign: 'center', padding: 24, color: '#6F6A60', fontSize: 14 }}>
            Sin liberaciones que coincidan con los filtros.
          </div>
        )}

        <TablaFooter ctrl={ctrlHistorial} />
      </div>

      {/* ── Modal liberar ── */}
      {liberar && (
        <div
          onClick={() => setLiberar(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(20,24,29,0.55)', zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={'Liberar ' + liberar.id_unidad}
            style={{ background: '#fff', borderRadius: 14, maxWidth: 520, width: '100%', padding: 26, boxShadow: '0 20px 60px rgba(0,0,0,0.35)', borderTop: '5px solid #F2620F', animation: 'fadeUp 0.2s ease' }}
          >
            <h3 style={{ fontFamily: FD, fontWeight: 700, fontSize: 22, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#16191E', margin: '0 0 10px' }}>
              Liberar {liberar.id_unidad}
            </h3>
            <p style={{ margin: '0 0 14px', fontSize: 14.5, color: '#4A4438' }}>
              {liberar.diagnostico} · ingresó el {liberar.fecha_ingreso}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <button
                  onClick={() => setTipo('Total')}
                  className="hv-borde-ink"
                  style={{
                    padding: '13px 10px', borderRadius: 9, fontSize: 14, fontWeight: 700, cursor: 'pointer',
                    background: tipo === 'Total' ? '#E5F3E9' : '#fff',
                    color: tipo === 'Total' ? '#2C7A44' : '#6F6A60',
                    border: tipo === 'Total' ? '2px solid #3FA65C' : '1px solid #D8D2C4',
                  }}
                >
                  Reparación Total
                </button>
                <button
                  onClick={() => setTipo('Parcial')}
                  className="hv-borde-naranja-solo"
                  style={{
                    padding: '13px 10px', borderRadius: 9, fontSize: 14, fontWeight: 700, cursor: 'pointer',
                    background: tipo === 'Parcial' ? '#FDE8DC' : '#fff',
                    color: tipo === 'Parcial' ? '#B4430A' : '#6F6A60',
                    border: tipo === 'Parcial' ? '2px solid #F2620F' : '1px solid #D8D2C4',
                  }}
                >
                  Parcial (mejoralito)
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <label style={etiqueta}>
                  Fecha de salida
                  <input type="date" style={campo} value={fechaSalida} onChange={(e) => setFechaSalida(e.target.value)} />
                </label>
                <label style={etiqueta}>
                  Costo de taller (MXN)
                  <input type="number" min={0} style={campo} value={costo} onChange={(e) => setCosto(e.target.value)} />
                </label>
              </div>
              {tipo === 'Parcial' && (
                <label style={etiqueta}>
                  Pendientes (uno por línea)
                  <textarea
                    rows={3}
                    style={{ ...campo, resize: 'vertical' }}
                    placeholder={'Wiper\nChapa de puerta'}
                    value={pendientes}
                    onChange={(e) => setPendientes(e.target.value)}
                  />
                  <span style={{ fontSize: 12.5, fontWeight: 400, color: '#6F6A60' }}>
                    Las fallas no resueltas generan la alerta de deuda técnica (RF-TAL-04).
                  </span>
                </label>
              )}
            </div>
            {errorModal && (
              <div role="alert" style={{ marginTop: 12, background: '#FBEBE8', border: '1px solid #E8A99D', color: '#9B2C2C', borderRadius: 9, padding: '12px 14px', fontSize: 14 }}>
                {errorModal}
              </div>
            )}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
              <button
                onClick={() => setLiberar(null)}
                className="hv-crema"
                style={{ padding: '10px 18px', background: '#fff', border: '1px solid #D8D2C4', borderRadius: 8, fontSize: 14, fontWeight: 700, color: '#16191E', cursor: 'pointer' }}
              >
                Cancelar
              </button>
              <button
                onClick={() => void confirmarLiberacion()}
                className="hv-naranja"
                style={{ padding: '10px 20px', background: '#F2620F', border: 'none', borderRadius: 8, fontFamily: FD, fontSize: 16, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#fff', cursor: 'pointer' }}
              >
                Liberar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
