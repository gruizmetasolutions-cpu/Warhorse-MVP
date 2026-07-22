import { useCallback, useEffect, useState, type CSSProperties } from 'react'
import { useNavigate } from 'react-router'
import Ayuda from '../components/Ayuda'
import Kicker from '../components/Kicker'
import { ApiError, ajustarParametros, getDashboard, getSaludDatos, type DashboardApi, type SaludDatosApi, type Veredicto } from '../lib/api'
import { useDemo } from '../lib/demo'
import { card, FD, fmt, h2Titulo, h3Titulo, subTitulo } from '../lib/estilos'

const campo: CSSProperties = { padding: 12, border: '1px solid #D8D2C4', borderRadius: 9, fontSize: 15, background: '#FAF7F0', width: '100%' }
const etiqueta: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 6, fontSize: 14, fontWeight: 600 }

// Presentación del veredicto server-side (RF-DASH-04): etiqueta del demo,
// color del texto y fondo de la franja superior de la tarjeta.
const veredictoUi: Record<Veredicto | 'pendiente', { label: string; color: string; franja: string }> = {
  Vender: { label: 'Vender / dar de baja', color: '#B4430A', franja: 'repeating-linear-gradient(135deg,#F2620F 0 12px,#16191E 12px 24px)' },
  Evaluar: { label: 'Evaluar', color: '#8A6D1A', franja: '#E0C36A' },
  Mantener: { label: 'Mantener', color: '#2C7A44', franja: '#3FA65C' },
  pendiente: { label: 'Valor pendiente', color: '#4A4438', franja: '#C9C2B2' },
}

export default function Dashboard() {
  const { selTractoId, setSelTractoId, toast } = useDemo()
  const navigate = useNavigate()
  const [dash, setDash] = useState<DashboardApi | null>(null)
  const [salud, setSalud] = useState<SaludDatosApi | null>(null)
  const [ajustar, setAjustar] = useState(false)
  const [umbralForm, setUmbralForm] = useState('')
  const [ventanaForm, setVentanaForm] = useState('')
  const [errorModal, setErrorModal] = useState('')
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  const [tipoUnidad, setTipoUnidad] = useState('Todos')

  const cargar = useCallback(async (seleccion: string) => {
    setDash(await getDashboard(seleccion || undefined))
  }, [])

  useEffect(() => {
    void cargar(selTractoId)
  }, [cargar, selTractoId])

  useEffect(() => {
    void getSaludDatos().then(setSalud)
  }, [])

  if (!dash) return null

  const kpis = [
    { label: 'Gasto Diésel', valor: fmt(dash.kpis.diesel), sub: 'Histórico cargado · ' + dash.ranking.length + ' tractos', accent: '#F2620F' },
    { label: 'Gasto Refacciones', valor: fmt(dash.kpis.refacciones), sub: 'Incluye piezas de yonke estimadas', accent: '#16191E' },
    { label: 'Gasto Taller', valor: fmt(dash.kpis.taller), sub: 'Mano de obra y diagnóstico', accent: '#F2620F' },
    { label: 'Costo Real Acumulado', valor: fmt(dash.kpis.costo_real_acumulado), sub: 'Diésel + refacciones + taller', accent: '#16191E' },
  ]

  // Barras en el orden de flota del demo; el ranking del server marca la crítica
  const barras = dash.ranking.slice().sort((a, b) => a.id_unidad.localeCompare(b.id_unidad))
  const maxCosto = Math.max(1, ...dash.ranking.map((t) => t.costo_total))
  const sel = dash.seleccion

  const ef = sel?.eficiencia_km_l ?? null
  const gaugeDeg = ef === null ? -90 : Math.round((Math.min(3, Math.max(0, ef)) / 3) * 180 - 90)

  const pctTotal = sel?.pct_reparacion_total ?? 100
  const donutC = 2 * Math.PI * 45
  const donutDash = ((pctTotal / 100) * donutC).toFixed(1) + ' ' + donutC.toFixed(1)

  const ui = veredictoUi[sel?.veredicto ?? 'pendiente']

  const abrirAjuste = () => {
    setErrorModal('')
    setUmbralForm(String(dash.parametros.umbral_pct))
    setVentanaForm(String(dash.parametros.ventana_meses))
    setAjustar(true)
  }

  const guardarAjuste = async () => {
    setErrorModal('')
    try {
      await ajustarParametros({ umbral_pct: Number(umbralForm), ventana_meses: Number(ventanaForm) })
      setAjustar(false)
      toast('Parámetros actualizados — veredictos recalculados.')
      await cargar(selTractoId)
    } catch (e) {
      if (e instanceof ApiError) {
        const campos = e.fields ? Object.values(e.fields).flat() : []
        setErrorModal(campos[0] ?? e.message)
      } else {
        setErrorModal('No se pudieron guardar los parámetros.')
      }
    }
  }

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap', animation: 'fadeUp 0.35s ease' }}>
        <div>
          <Kicker texto="Dirección" />
          <h2 style={h2Titulo}>Tablero Directivo</h2>
          <p style={subTitulo}>¿Vale la pena meterle más lana a este tracto? Haz clic en una barra para analizarlo.</p>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', background: '#fff', border: '1px solid #D8D2C4', borderRadius: 9, padding: '12px 16px', fontSize: 13.5 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>Desde:</span>
            <input type="date" style={{ padding: '6px 10px', border: '1px solid #D8D2C4', borderRadius: 6, fontSize: 13 }} value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>Hasta:</span>
            <input type="date" style={{ padding: '6px 10px', border: '1px solid #D8D2C4', borderRadius: 6, fontSize: 13 }} value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>Tipo:</span>
            <select style={{ padding: '6px 10px', border: '1px solid #D8D2C4', borderRadius: 6, fontSize: 13, background: '#FAF7F0' }} value={tipoUnidad} onChange={(e) => setTipoUnidad(e.target.value)}>
              <option>Todos</option>
              <option>Tractor</option>
              <option>Caja</option>
              <option>Thermo</option>
              <option>Servicio</option>
            </select>
          </div>
        </div>
        <div style={{ display: 'none', alignItems: 'center', gap: 8, background: '#fff', border: '1px solid #D8D2C4', borderRadius: 9, padding: '9px 16px', fontSize: 14 }}>
          Periodo:{' '}
          <strong style={{ fontFamily: FD, fontWeight: 700, fontSize: 16, letterSpacing: '0.04em' }}>JULIO 2026</strong>
          <span style={{ color: '#8A8374', fontSize: 11 }}>▾</span>
        </div>
      </div>

      <div data-tour="kpis" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(210px,1fr))', gap: 16, animation: 'fadeUp 0.4s ease' }}>
        {kpis.map((k) => (
          <div key={k.label} style={{ background: '#fff', border: '1px solid #E7E0D2', borderRadius: 12, padding: '18px 20px 16px', display: 'flex', flexDirection: 'column', gap: 6, boxShadow: '0 1px 2px rgba(20,24,29,0.05)' }}>
            <span style={{ fontFamily: FD, fontSize: 13, fontWeight: 600, color: '#8A8374', textTransform: 'uppercase', letterSpacing: '0.14em' }}>{k.label}</span>
            <span style={{ fontFamily: FD, fontSize: 38, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: '#16191E', lineHeight: 1 }}>{k.valor}</span>
            <span style={{ fontSize: 12.5, color: '#6F6A60' }}>{k.sub}</span>
            <span style={{ width: 30, height: 4, background: k.accent, marginTop: 2 }} />
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: 16, alignItems: 'stretch', animation: 'fadeUp 0.45s ease' }}>
        <div data-tour="barras" style={{ ...card, gridColumn: '1/-1', overflow: 'hidden', minWidth: 0, maxWidth: '100%', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '0 0 18px' }}>
            <h3 style={h3Titulo}>Gasto consolidado por tracto</h3>
            <Ayuda tip="Suma de diésel + refacciones + taller por unidad en el periodo. La barra rayada marca el tracto más caro. Clic en una barra = analizar esa unidad." />
          </div>
          <div style={{ width: '100%', maxWidth: '100%', minWidth: 0, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 3, height: 222, width: '100%', minWidth: 0, padding: '10px 2px 12px 2px', borderBottom: '2px solid #16191E', overflow: 'hidden' }}>
              {barras.map((t) => {
                const esSel = t.id_unidad === sel?.id_unidad
                const h = Math.max(8, Math.round((t.costo_total / maxCosto) * 140))
                return (
                  <button
                    key={t.id}
                    onClick={() => setSelTractoId(t.id_unidad)}
                    title={'Analizar ' + t.id_unidad}
                    className="hv-op85"
                    style={{ flex: '1 1 0', minWidth: 0, maxWidth: '100%', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', gap: 5, background: 'none', border: 'none', cursor: 'pointer', padding: '0 1px', height: '100%' }}
                  >
                    <span style={{ display: 'block', width: '100%', textAlign: 'center', fontFamily: FD, fontSize: 10.5, lineHeight: 1.1, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: '#16191E', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {fmt(t.costo_total)}
                    </span>
                    <span
                      style={{
                        width: '100%', maxWidth: 24, minWidth: 12, height: h, borderRadius: '4px 4px 0 0',
                        background: t.critico ? 'repeating-linear-gradient(135deg,#F2620F 0 10px,#D9550C 10px 20px)' : '#16191E',
                        outline: esSel ? '3px solid #F2620F' : 'none', outlineOffset: 2,
                        transition: 'height 0.3s ease', transformOrigin: 'bottom', animation: 'growBar 0.5s ease',
                      }}
                    />
                    <span
                      style={{
                        fontFamily: FD, fontSize: 10.5, fontWeight: esSel ? 700 : 600, letterSpacing: '0.03em',
                        color: esSel ? '#F2620F' : '#6F6A60',
                        borderBottom: esSel ? '3px solid #F2620F' : '3px solid transparent', paddingBottom: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%',
                      }}
                    >
                      {t.id_unidad}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        <div style={{ ...card, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h3 style={h3Titulo}>Rendimiento · {sel?.id_unidad ?? '—'}</h3>
            <Ayuda tip="Kilómetros por litro reales, calculados de las cargas de diésel dentro de la ventana. Zona verde = eficiente; naranja = revisar operación o motor." />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <svg viewBox="0 0 200 120" style={{ width: 'min(240px,100%)' }} role="img" aria-label={ef === null ? 'Sin cargas de diésel en la ventana' : `Eficiencia: ${ef.toFixed(1)} kilómetros por litro`}>
              <path d="M 24 104 A 76 76 0 0 1 62 38" fill="none" stroke="#E2DCCF" strokeWidth="14" strokeLinecap="round" />
              <path d="M 62 38 A 76 76 0 0 1 138 38" fill="none" stroke="#F2620F" strokeWidth="14" strokeLinecap="round" />
              <path d="M 138 38 A 76 76 0 0 1 176 104" fill="none" stroke="#3FA65C" strokeWidth="14" strokeLinecap="round" />
              <line x1="100" y1="104" x2="100" y2="42" stroke="#16191E" strokeWidth="4" strokeLinecap="round" transform={`rotate(${gaugeDeg} 100 104)`} style={{ transition: 'transform 0.5s ease' }} />
              <circle cx="100" cy="104" r="7" fill="#16191E" />
            </svg>
            <div style={{ fontFamily: FD, fontSize: 34, fontWeight: 700, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
              {ef === null ? '—' : ef.toFixed(1)} <span style={{ fontSize: 16, fontWeight: 500, color: '#6F6A60' }}>km/L</span>
            </div>
            <div style={{ fontSize: 13, color: '#6F6A60' }}>
              {ef === null ? 'Sin cargas de diésel en la ventana' : 'Costo diésel vs. kilómetros recorridos'}
            </div>
          </div>
        </div>

        <div style={{ ...card, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h3 style={h3Titulo}>Mantenimiento · {sel?.id_unidad ?? '—'}</h3>
            <Ayuda tip='Proporción de reparaciones liberadas "en su totalidad" vs. "mejoralito" (parches). Mucho mejoralito = unidad reincidente.' />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap', justifyContent: 'center', flex: 1 }}>
            <svg viewBox="0 0 120 120" style={{ width: 130, flex: 'none' }} role="img" aria-label={`Mantenimiento: ${pctTotal}% reparación total, ${100 - pctTotal}% mejoralito`}>
              <circle cx="60" cy="60" r="45" fill="none" stroke="#F2620F" strokeWidth="18" />
              <circle cx="60" cy="60" r="45" fill="none" stroke="#3FA65C" strokeWidth="18" strokeDasharray={donutDash} transform="rotate(-90 60 60)" style={{ transition: 'stroke-dasharray 0.5s ease' }} />
              <text x="60" y="68" textAnchor="middle" style={{ fontFamily: FD, fontWeight: 700, fontSize: 24 }} fill="#16191E">
                {pctTotal}%
              </text>
            </svg>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 12, height: 12, borderRadius: 3, background: '#3FA65C' }} />
                Reparación Total · {pctTotal}%
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 12, height: 12, borderRadius: 3, background: '#F2620F' }} />
                Mejoralito · {100 - pctTotal}%
              </div>
              <div style={{ fontSize: 12.5, color: '#6F6A60', maxWidth: 200 }}>
                Calculado del historial de reparaciones liberadas.
              </div>
            </div>
          </div>
        </div>

        <div
          data-tour="decision"
          style={{ ...card, display: 'flex', flexDirection: 'column', gap: 10, overflow: 'hidden' }}
        >
          <div style={{ height: 6, background: ui.franja, borderRadius: '12px 12px 0 0', margin: '-22px -22px 8px' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ fontFamily: FD, fontWeight: 600, fontSize: 13, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#8A8374' }}>
              Decisión sugerida · {sel?.id_unidad ?? '—'}
            </div>
            <Ayuda tip="Regla: si el costo acumulado supera el % umbral del valor de la unidad, el Hub sugiere evaluar o vender según sus mejoralitos. El umbral y la ventana se ajustan aquí mismo." />
          </div>
          <div style={{ fontFamily: FD, fontWeight: 700, fontSize: 36, lineHeight: 1, textTransform: 'uppercase', letterSpacing: '0.02em', color: ui.color }}>
            {ui.label}
          </div>
          <p style={{ margin: 0, fontSize: 14.5, color: '#16191E', lineHeight: 1.55 }}>{sel?.razon ?? 'Sin unidades activas que analizar.'}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginTop: 6 }}>
            <button
              onClick={() => sel && navigate('/ficha/' + sel.id_unidad)}
              className="hv-ficha"
              style={{ padding: '11px 20px', background: '#16191E', color: '#F3EFE7', border: 'none', borderRadius: 8, fontFamily: FD, fontWeight: 700, fontSize: 16, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer' }}
            >
              Ver ficha completa →
            </button>
            <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10, fontSize: 12.5, color: '#8A8374' }}>
              Umbral {dash.parametros.umbral_pct}% · Ventana {dash.parametros.ventana_meses} meses
              <button
                onClick={abrirAjuste}
                className="hv-borde-naranja"
                style={{ background: '#fff', border: '1px solid #D8D2C4', borderRadius: 7, padding: '7px 12px', fontSize: 12.5, fontWeight: 700, color: '#16191E', cursor: 'pointer' }}
              >
                Ajustar parámetros
              </button>
            </span>
          </div>
        </div>
        {salud && (
          <div style={{ ...card, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h3 style={h3Titulo}>Salud de datos</h3>
              <Ayuda tip="El mayor riesgo del Hub es de adopción: si el piso no registra, el ROI miente. Estas métricas miden si los datos llegan completos (SRS §9)." />
            </div>
            {[
              { label: 'Requisiciones con foto y origen', pct: salud.requisiciones.pct, sub: `${salud.requisiciones.con_foto_y_origen} de ${salud.requisiciones.total}` },
              { label: 'Liberaciones con tipo', pct: salud.liberaciones.pct, sub: `${salud.liberaciones.con_tipo} de ${salud.liberaciones.total}` },
              {
                label: 'Yonke con costo asignado',
                pct: salud.yonke.pct,
                sub: `${salud.yonke.total} · catalogo ${salud.yonke.por_origen.catalogo} · última compra ${salud.yonke.por_origen.ultima_compra} · manual ${salud.yonke.por_origen.manual}`,
              },
            ].map((m) => (
              <div key={m.label} style={{ display: 'flex', alignItems: 'baseline', gap: 10, borderBottom: '1px solid #EFEAE0', paddingBottom: 8 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{m.label}</div>
                  <div style={{ fontSize: 12.5, color: '#6F6A60' }}>{m.sub}</div>
                </div>
                <span
                  style={{
                    fontFamily: FD, fontWeight: 700, fontSize: 24, fontVariantNumeric: 'tabular-nums',
                    color: m.pct >= 90 ? '#2C7A44' : m.pct >= 60 ? '#8A6D1A' : '#B4430A',
                  }}
                >
                  {m.pct}%
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {ajustar && (
        <div
          onClick={() => setAjustar(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(20,24,29,0.55)', zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Ajustar parámetros"
            style={{ background: '#fff', borderRadius: 14, maxWidth: 440, width: '100%', padding: 26, boxShadow: '0 20px 60px rgba(0,0,0,0.35)', borderTop: '5px solid #F2620F', animation: 'fadeUp 0.2s ease' }}
          >
            <h3 style={{ fontFamily: FD, fontWeight: 700, fontSize: 22, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#16191E', margin: '0 0 10px' }}>
              Ajustar parámetros
            </h3>
            <p style={{ margin: '0 0 14px', fontSize: 14.5, color: '#4A4438' }}>
              El veredicto se recalcula al instante para toda la flota (RF-DASH-05). El cambio queda auditado.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <label style={etiqueta}>
                Umbral (%)
                <input type="number" min={20} max={80} style={campo} value={umbralForm} onChange={(e) => setUmbralForm(e.target.value)} />
              </label>
              <label style={etiqueta}>
                Ventana (meses)
                <input type="number" min={1} max={36} style={campo} value={ventanaForm} onChange={(e) => setVentanaForm(e.target.value)} />
              </label>
            </div>
            <p style={{ margin: '10px 0 0', fontSize: 12.5, color: '#6F6A60' }}>
              Umbral permitido: 20–80%. Ventana permitida: 1–36 meses.
            </p>
            {errorModal && (
              <div role="alert" style={{ marginTop: 12, background: '#FBEBE8', border: '1px solid #E8A99D', color: '#9B2C2C', borderRadius: 9, padding: '12px 14px', fontSize: 14 }}>
                {errorModal}
              </div>
            )}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
              <button
                onClick={() => setAjustar(false)}
                className="hv-crema"
                style={{ padding: '10px 18px', background: '#fff', border: '1px solid #D8D2C4', borderRadius: 8, fontSize: 14, fontWeight: 700, color: '#16191E', cursor: 'pointer' }}
              >
                Cancelar
              </button>
              <button
                onClick={() => void guardarAjuste()}
                className="hv-naranja"
                style={{ padding: '10px 20px', background: '#F2620F', border: 'none', borderRadius: 8, fontFamily: FD, fontSize: 16, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#fff', cursor: 'pointer' }}
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
