import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react'
import Kicker from '../components/Kicker'
import { SortTh, TablaFooter, TablaToolbar } from '../components/TablaControls'
import { ApiError, getTaller, liberarUnidad, registrarIngreso, type RegistroTallerApi } from '../lib/api'
import { useDemo } from '../lib/demo'
import { badge, card, critStyle, FD, fmt, h2Titulo, h3Titulo, subTitulo, tdCell, theadRow, urgColors } from '../lib/estilos'
import { useTabla } from '../lib/useTabla'

const campo: CSSProperties = { padding: 12, border: '1px solid var(--border-color)', borderRadius: 9, fontSize: 15, background: 'var(--bg-input)', width: '100%' }
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
  const [verDetalle, setVerDetalle] = useState<RegistroTallerApi | null>(null)
  const [evidencias, setEvidencias] = useState<{ nombre: string; url: string }[]>([])

  const evidenciasGuardadas = useMemo(() => {
    if (!verDetalle) return []
    try {
      const data = localStorage.getItem('taller_evidencias_' + verDetalle.id)
      return data ? JSON.parse(data) : []
    } catch {
      return []
    }
  }, [verDetalle])

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
      localStorage.setItem('taller_evidencias_' + liberar.id, JSON.stringify(evidencias))
      setEvidencias([])
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
                      background: act ? color[0] : 'rgba(15, 15, 16, 0.8)', color: act ? color[1] : '#9ca3af',
                      border: act ? '2px solid ' + color[2] : '1px solid rgba(197, 160, 89, 0.2)',
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
            style={{ padding: '12px 20px', background: 'var(--accent-gold)', color: 'var(--text-main)', border: 'none', borderRadius: 9, fontFamily: FD, fontWeight: 700, fontSize: 16, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer' }}
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
              <th style={{ padding: '12px 10px', borderBottom: '2px solid rgba(197, 160, 89, 0.3)' }}>Unidad</th>
              <th style={{ padding: '12px 10px', borderBottom: '2px solid rgba(197, 160, 89, 0.3)' }}>Ingreso</th>
              <th style={{ padding: '12px 10px', borderBottom: '2px solid rgba(197, 160, 89, 0.3)' }}>Diagnóstico</th>
              <th style={{ padding: '12px 10px', borderBottom: '2px solid rgba(197, 160, 89, 0.3)' }}>Criticidad</th>
              <th style={{ padding: '12px 10px', borderBottom: '2px solid rgba(197, 160, 89, 0.3)' }} />
            </tr>
          </thead>
          <tbody>
            {enTaller.map((r) => (
              <tr
                key={r.id}
                className="hv-fila"
                onClick={() => setVerDetalle(r)}
                style={{ cursor: 'pointer' }}
              >
                <td style={{ ...tdCell, fontFamily: FD, fontWeight: 700, fontSize: 17 }}>{r.id_unidad}</td>
                <td style={{ ...tdCell, whiteSpace: 'nowrap' }}>{r.fecha_ingreso}</td>
                <td style={{ ...tdCell, fontWeight: 600 }}>
                  {r.diagnostico}
                  {Boolean(r.es_reincidencia) && (
                    <span style={{ marginLeft: 8 }}>
                      <span style={badge('#FDE8DC', '#B4430A', '#C5A059')}>Reincidencia</span>
                    </span>
                  )}
                </td>
                <td style={tdCell}>
                  <span style={critStyle(r.criticidad)}>{r.criticidad}</span>
                </td>
                <td style={{ ...tdCell, textAlign: 'right' }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setErrorModal(''); setTipo('Total'); setFechaSalida(''); setCosto(''); setPendientes(''); setEvidencias([])
                      setLiberar(r)
                    }}
                    className="hv-op85"
                    style={{ padding: '7px 12px', background: 'transparent', border: '1px solid rgba(197, 160, 89, 0.4)', borderRadius: 7, fontSize: 12.5, fontWeight: 700, color: 'var(--accent-gold)', cursor: 'pointer' }}
                  >
                    Liberar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {enTaller.length === 0 && (
          <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)', fontSize: 14 }}>
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
              <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Criticidad</span>
              {(['Todos', 'Rápida', 'Media', 'Crítico'] as FiltroCrit[]).map((c) => (
                <button
                  key={c}
                  onClick={() => { setFiltroCrit(c); ctrlHistorial.resetPage() }}
                  className="hv-borde-ink"
                  style={{
                    padding: '5px 10px', borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                    background: filtroCrit === c ? '#C5A059' : 'rgba(15, 15, 16, 0.8)',
                    color: filtroCrit === c ? '#000' : '#9ca3af',
                    border: filtroCrit === c ? '1px solid #C5A059' : '1px solid rgba(197, 160, 89, 0.2)',
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
              <tr key={r.id} className="hv-fila" style={{ cursor: 'pointer' }} onClick={() => setVerDetalle(r)}>
                <td style={{ ...tdCell, fontFamily: FD, fontWeight: 700, fontSize: 17 }}>{r.id_unidad}</td>
                <td style={{ ...tdCell, whiteSpace: 'nowrap' }}>{r.fecha_ingreso}</td>
                <td style={{ ...tdCell, fontWeight: 600 }}>
                  {r.diagnostico}
                  {Boolean(r.es_reincidencia) && (
                    <span style={{ marginLeft: 8 }}>
                      <span style={badge('#FDE8DC', '#B4430A', '#C5A059')}>Reincidencia</span>
                    </span>
                  )}
                </td>
                <td style={tdCell}>
                  <span style={r.tipo_liberacion === 'Total' ? badge('#E5F3E9', '#2C7A44', '#9FD4B0') : badge('#FDE8DC', '#B4430A', '#C5A059')}>
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
          <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)', fontSize: 14 }}>
            Sin liberaciones que coincidan con los filtros.
          </div>
        )}

        <TablaFooter ctrl={ctrlHistorial} />
      </div>

      {/* ── Modal liberar ── */}
      {liberar && (
        <div
          onClick={() => setLiberar(null)}
          style={{ position: 'fixed', inset: 0, background: 'var(--bg-overlay)', zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={'Liberar ' + liberar.id_unidad}
            style={{ background: 'var(--bg-glass)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderRadius: 14, maxWidth: 520, width: '100%', padding: 26, boxShadow: '0 20px 60px rgba(0,0,0,0.35)', borderTop: '5px solid #C5A059', animation: 'fadeUp 0.2s ease' }}
          >
            <h3 style={{ fontFamily: FD, fontWeight: 700, fontSize: 22, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--text-main)', margin: '0 0 10px' }}>
              Liberar {liberar.id_unidad}
            </h3>
            <p style={{ margin: '0 0 14px', fontSize: 14.5, color: 'var(--text-muted)' }}>
              {liberar.diagnostico} · ingresó el {liberar.fecha_ingreso}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <button
                  onClick={() => setTipo('Total')}
                  className="hv-borde-ink"
                  style={{
                    padding: '13px 10px', borderRadius: 9, fontSize: 14, fontWeight: 700, cursor: 'pointer',
                    background: tipo === 'Total' ? '#4ADE80' : 'rgba(15, 15, 16, 0.8)',
                    color: tipo === 'Total' ? '#000' : '#9ca3af',
                    border: tipo === 'Total' ? '2px solid #4ADE80' : '1px solid rgba(197, 160, 89, 0.2)',
                  }}
                >
                  Reparación Total
                </button>
                <button
                  onClick={() => setTipo('Parcial')}
                  className="hv-borde-naranja-solo"
                  style={{
                    padding: '13px 10px', borderRadius: 9, fontSize: 14, fontWeight: 700, cursor: 'pointer',
                    background: tipo === 'Parcial' ? '#EF4444' : 'rgba(15, 15, 16, 0.8)',
                    color: tipo === 'Parcial' ? '#fff' : '#9ca3af',
                    border: tipo === 'Parcial' ? '2px solid #EF4444' : '1px solid rgba(197, 160, 89, 0.2)',
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
                  <span style={{ fontSize: 12.5, fontWeight: 400, color: 'var(--text-muted)' }}>
                    Las fallas no resueltas generan la alerta de deuda técnica (RF-TAL-04).
                  </span>
                </label>
              )}
              <div style={{ borderTop: '1px solid #E7E0D2', paddingTop: 10, marginTop: 10 }}>
                <span style={{ fontSize: 14, fontWeight: 700, display: 'block', marginBottom: 8 }}>
                  Evidencias de Reparación (Antes/Después, Lavado, K9)
                </span>
                <input
                  id="evidencia-reparacion"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const files = Array.from(e.target.files ?? [])
                    if (evidencias.length + files.length > 3) {
                      toast('La carga de evidencias está limitada a un máximo de 3 fotografías.')
                      return
                    }
                    files.forEach(file => {
                      const reader = new FileReader()
                      reader.onload = (evt) => {
                        const base64 = evt.target?.result as string
                        setEvidencias(prev => [...prev, { nombre: file.name, url: base64 }])
                      }
                      reader.readAsDataURL(file)
                    })
                  }}
                />
                <label
                  htmlFor="evidencia-reparacion"
                  className="hv-borde-naranja-solo"
                  style={{
                    border: '2px dashed #C9C2B2',
                    background: 'var(--bg-input)',
                    borderRadius: 10, padding: 14, cursor: 'pointer', textAlign: 'center', width: '100%', display: 'block',
                    transition: 'all 0.25s ease', fontSize: 13, fontWeight: 600, color: 'var(--text-muted)'
                  }}
                >
                  📷 Seleccionar fotografías de evidencia (máx. 3)
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                  {evidencias.map((ev, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-input)', padding: '6px 10px', borderRadius: 6, fontSize: 12.5 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <img src={ev.url} alt="" style={{ width: 28, height: 28, borderRadius: 4, objectFit: 'cover' }} />
                        <span>{ev.nombre}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setEvidencias(prev => prev.filter((_, idx) => idx !== i))}
                        style={{ background: 'transparent', border: 'none', color: '#C53030', cursor: 'pointer', fontWeight: 700 }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
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
                style={{ padding: '10px 18px', background: 'var(--bg-glass)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid var(--border-color)', borderRadius: 8, fontSize: 14, fontWeight: 700, color: 'var(--text-main)', cursor: 'pointer' }}
              >
                Cancelar
              </button>
              <button
                onClick={() => void confirmarLiberacion()}
                className="hv-naranja"
                style={{ padding: '10px 20px', background: 'var(--accent-gold)', border: 'none', borderRadius: 8, fontFamily: FD, fontSize: 16, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-main)', cursor: 'pointer' }}
              >
                Liberar
              </button>
            </div>
          </div>
        </div>
      )}

      {verDetalle && (
        <div
          onClick={() => setVerDetalle(null)}
          style={{ position: 'fixed', inset: 0, background: 'var(--bg-overlay)', zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={'Detalle de liberación - ' + verDetalle.id_unidad}
            style={{ background: 'var(--bg-glass)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderRadius: 14, maxWidth: 520, width: '100%', padding: 26, boxShadow: '0 20px 60px rgba(0,0,0,0.35)', borderTop: '5px solid #C5A059', animation: 'fadeUp 0.2s ease' }}
          >
            <h3 style={{ fontFamily: FD, fontWeight: 700, fontSize: 22, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--text-main)', margin: '0 0 14px' }}>
              Ficha de Liberación - {verDetalle.id_unidad}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <label style={etiqueta}>
                  Unidad
                  <div style={{ padding: 12, background: 'var(--bg-input)', borderRadius: 9, fontSize: 15, fontWeight: 600 }}>
                    {verDetalle.id_unidad}
                  </div>
                </label>
                <label style={etiqueta}>
                  Criticidad
                  <div style={{ padding: 6 }}>
                    <span style={critStyle(verDetalle.criticidad)}>{verDetalle.criticidad}</span>
                  </div>
                </label>
              </div>

              <label style={etiqueta}>
                Diagnóstico / Trabajo Realizado
                <div style={{ padding: 12, background: 'var(--bg-input)', borderRadius: 9, fontSize: 15, whiteSpace: 'pre-wrap', lineHeight: 1.4 }}>
                  {verDetalle.diagnostico}
                </div>
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <label style={etiqueta}>
                  Fecha de Ingreso
                  <div style={{ padding: 12, background: 'var(--bg-input)', borderRadius: 9, fontSize: 15 }}>
                    {verDetalle.fecha_ingreso}
                  </div>
                </label>
                <label style={etiqueta}>
                  Fecha de Salida
                  <div style={{ padding: 12, background: 'var(--bg-input)', borderRadius: 9, fontSize: 15 }}>
                    {verDetalle.fecha_salida ?? '—'}
                  </div>
                </label>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <label style={etiqueta}>
                  Días en Taller
                  <div style={{ padding: 12, background: 'var(--bg-input)', borderRadius: 9, fontSize: 15 }}>
                    {verDetalle.dias_en_taller !== null ? verDetalle.dias_en_taller + (verDetalle.dias_en_taller === 1 ? ' día' : ' días') : '—'}
                  </div>
                </label>
                <label style={etiqueta}>
                  Costo de Taller (MXN)
                  <div style={{ padding: 12, background: 'var(--bg-input)', borderRadius: 9, fontSize: 15, fontWeight: 700 }}>
                    {fmt(Number(verDetalle.costo_taller))}
                  </div>
                </label>
              </div>

              <label style={etiqueta}>
                Tipo de Liberación
                <div style={{ padding: 6 }}>
                  <span
                    style={
                      verDetalle.tipo_liberacion === null
                        ? badge('#E9F5FE', '#1A73E8', '#1A73E8')
                        : verDetalle.tipo_liberacion === 'Total'
                        ? badge('#E5F3E9', '#2C7A44', '#9FD4B0')
                        : badge('#FDE8DC', '#B4430A', '#C5A059')
                    }
                  >
                    {verDetalle.tipo_liberacion === null
                      ? 'En taller / Activo'
                      : verDetalle.tipo_liberacion === 'Total'
                      ? 'Reparación Total'
                      : 'Parcial (Mejoralito)'}
                  </span>
                </div>
              </label>

              {verDetalle.pendientes && verDetalle.pendientes.length > 0 && (
                <label style={etiqueta}>
                  Pendientes de Deuda Técnica
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: 12, background: '#FDF3EC', border: '1px dashed #C5A059', borderRadius: 9 }}>
                    {verDetalle.pendientes.map((p, i) => (
                      <div key={i} style={{ fontSize: 14, color: '#B4430A', fontWeight: 600 }}>
                        ⚠️ {p}
                      </div>
                    ))}
                  </div>
                </label>
              )}

              {evidenciasGuardadas && evidenciasGuardadas.length > 0 && (
                <label style={etiqueta}>
                  Evidencias de la Reparación
                  <div style={{ display: 'flex', gap: 10, marginTop: 8, flexWrap: 'wrap' }}>
                    {evidenciasGuardadas.map((ev: { nombre: string; url: string }, i: number) => (
                      <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center' }}>
                        <img
                          src={ev.url}
                          alt={ev.nombre}
                          style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border-color)' }}
                        />
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 600 }}>
                          {ev.nombre}
                        </span>
                      </div>
                    ))}
                  </div>
                </label>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
              <button
                onClick={() => setVerDetalle(null)}
                className="hv-naranja"
                style={{ padding: '10px 20px', background: 'var(--accent-gold)', border: 'none', borderRadius: 8, fontFamily: FD, fontSize: 16, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-main)', cursor: 'pointer' }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
