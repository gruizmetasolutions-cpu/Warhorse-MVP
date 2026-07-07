import { useNavigate } from 'react-router'
import Ayuda from '../components/Ayuda'
import Kicker from '../components/Kicker'
import { useDemo } from '../lib/demo'
import { card, FD, fmt, h2Titulo, h3Titulo, subTitulo } from '../lib/estilos'

export default function Dashboard() {
  const { datos, umbral, selTractoId, setSelTractoId } = useDemo()
  const navigate = useNavigate()
  if (!datos) return null

  const activos = datos.tractos.filter((t) => t.estado === 'Activo' && t.tipo === 'Tractor')
  const totDiesel = activos.reduce((a, t) => a + t.gasto_diesel, 0)
  const totRefac = activos.reduce((a, t) => a + t.gasto_refacciones, 0)
  const totTaller = activos.reduce((a, t) => a + t.gasto_taller, 0)
  const kpis = [
    { label: 'Gasto Diésel', valor: fmt(totDiesel), sub: 'Histórico cargado · ' + activos.length + ' tractos', accent: '#F2620F' },
    { label: 'Gasto Refacciones', valor: fmt(totRefac), sub: 'Incluye piezas de yonke estimadas', accent: '#16191E' },
    { label: 'Gasto Taller', valor: fmt(totTaller), sub: 'Mano de obra y diagnóstico', accent: '#F2620F' },
    { label: 'Costo Real Acumulado', valor: fmt(totDiesel + totRefac + totTaller), sub: 'Diésel + refacciones + taller', accent: '#16191E' },
  ]

  const maxCosto = Math.max(...activos.map((t) => t.costo_total))
  const sel = activos.find((t) => t.id === selTractoId) ?? activos[0]

  const ef = sel.eficiencia_diesel_km
  const gaugeDeg = Math.round((Math.min(3, Math.max(0, ef)) / 3) * 180 - 90)

  const repsSel = datos.reparaciones.filter((r) => r.tracto_id === sel.id)
  const nTot = repsSel.filter((r) => r.tipo_liberacion === 'Total').length
  const pctTotal = repsSel.length ? Math.round((nTot / repsSel.length) * 100) : 100
  const donutC = 2 * Math.PI * 45
  const donutDash = ((pctTotal / 100) * donutC).toFixed(1) + ' ' + donutC.toFixed(1)

  const pctValor = sel.valor_estimado ? Math.round((sel.costo_total / sel.valor_estimado) * 100) : 0
  const vender = pctValor >= umbral
  const decisionLabel = vender ? 'Vender / dar de baja' : 'Mantener'
  const decisionRazon = vender
    ? 'El costo acumulado (' + fmt(sel.costo_total) + ') ya representa el ' + pctValor + '% del valor estimado del tracto (' + fmt(sel.valor_estimado) + '), por encima del umbral del ' + umbral + '%. Además, ' + (100 - pctTotal) + '% de sus liberaciones fueron "mejoralito": reincide.'
    : 'El costo acumulado (' + fmt(sel.costo_total) + ') representa el ' + pctValor + '% del valor estimado (' + fmt(sel.valor_estimado) + '), debajo del umbral del ' + umbral + '%. La unidad sigue siendo un activo rentable.'

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap', animation: 'fadeUp 0.35s ease' }}>
        <div>
          <Kicker texto="Dirección" />
          <h2 style={h2Titulo}>Tablero Directivo</h2>
          <p style={subTitulo}>¿Vale la pena meterle más lana a este tracto? Haz clic en una barra para analizarlo.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff', border: '1px solid #D8D2C4', borderRadius: 9, padding: '9px 16px', fontSize: 14 }}>
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
        <div data-tour="barras" style={{ ...card, gridColumn: '1/-1' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '0 0 18px' }}>
            <h3 style={h3Titulo}>Gasto consolidado por tracto</h3>
            <Ayuda tip="Suma de diésel + refacciones + taller por unidad en el periodo. La barra rayada marca el tracto más caro. Clic en una barra = analizar esa unidad." />
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 'clamp(10px,3vw,34px)', height: 210, padding: '0 6px', borderBottom: '2px solid #16191E' }}>
            {activos.map((t) => {
              const crit = t.costo_total === maxCosto
              const esSel = t.id === sel.id
              const h = Math.max(8, Math.round((t.costo_total / maxCosto) * 140))
              return (
                <button
                  key={t.id}
                  onClick={() => setSelTractoId(t.id)}
                  title={'Analizar ' + t.id}
                  className="hv-op85"
                  style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', gap: 6, background: 'none', border: 'none', cursor: 'pointer', padding: 0, height: '100%' }}
                >
                  <span style={{ fontFamily: FD, fontSize: 16, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: '#16191E' }}>
                    {fmt(t.costo_total)}
                  </span>
                  <span
                    style={{
                      width: 'min(58px,100%)', height: h, borderRadius: '4px 4px 0 0',
                      background: crit ? 'repeating-linear-gradient(135deg,#F2620F 0 10px,#D9550C 10px 20px)' : '#16191E',
                      outline: esSel ? '3px solid #F2620F' : 'none', outlineOffset: 2,
                      transition: 'height 0.3s ease', transformOrigin: 'bottom', animation: 'growBar 0.5s ease',
                    }}
                  />
                  <span
                    style={{
                      fontFamily: FD, fontSize: 15, fontWeight: esSel ? 700 : 600, letterSpacing: '0.06em',
                      color: esSel ? '#F2620F' : '#6F6A60',
                      borderBottom: esSel ? '3px solid #F2620F' : '3px solid transparent', paddingBottom: 2,
                    }}
                  >
                    {t.id}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        <div style={{ ...card, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h3 style={h3Titulo}>Rendimiento · {sel.id}</h3>
            <Ayuda tip="Kilómetros por litro estimados del tracto seleccionado. Zona verde = eficiente; naranja = revisar operación o motor." />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <svg viewBox="0 0 200 120" style={{ width: 'min(240px,100%)' }} role="img" aria-label={`Eficiencia: ${ef.toFixed(1)} kilómetros por litro`}>
              <path d="M 24 104 A 76 76 0 0 1 62 38" fill="none" stroke="#E2DCCF" strokeWidth="14" strokeLinecap="round" />
              <path d="M 62 38 A 76 76 0 0 1 138 38" fill="none" stroke="#F2620F" strokeWidth="14" strokeLinecap="round" />
              <path d="M 138 38 A 76 76 0 0 1 176 104" fill="none" stroke="#3FA65C" strokeWidth="14" strokeLinecap="round" />
              <line x1="100" y1="104" x2="100" y2="42" stroke="#16191E" strokeWidth="4" strokeLinecap="round" transform={`rotate(${gaugeDeg} 100 104)`} style={{ transition: 'transform 0.5s ease' }} />
              <circle cx="100" cy="104" r="7" fill="#16191E" />
            </svg>
            <div style={{ fontFamily: FD, fontSize: 34, fontWeight: 700, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
              {ef.toFixed(1)} <span style={{ fontSize: 16, fontWeight: 500, color: '#6F6A60' }}>km/L</span>
            </div>
            <div style={{ fontSize: 13, color: '#6F6A60' }}>Costo diésel vs. kilómetros recorridos</div>
          </div>
        </div>

        <div style={{ ...card, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h3 style={h3Titulo}>Mantenimiento · {sel.id}</h3>
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
          <div style={{ height: 6, background: vender ? 'repeating-linear-gradient(135deg,#F2620F 0 12px,#16191E 12px 24px)' : '#3FA65C', borderRadius: '12px 12px 0 0', margin: '-22px -22px 8px' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ fontFamily: FD, fontWeight: 600, fontSize: 13, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#8A8374' }}>
              Decisión sugerida · {sel.id}
            </div>
            <Ayuda tip="Regla: si el costo acumulado supera el % umbral del valor de la unidad, el Hub sugiere vender. El umbral se ajusta en Tweaks." />
          </div>
          <div style={{ fontFamily: FD, fontWeight: 700, fontSize: 36, lineHeight: 1, textTransform: 'uppercase', letterSpacing: '0.02em', color: vender ? '#B4430A' : '#2C7A44' }}>
            {decisionLabel}
          </div>
          <p style={{ margin: 0, fontSize: 14.5, color: '#16191E', lineHeight: 1.55 }}>{decisionRazon}</p>
          <button
            onClick={() => navigate('/ficha/' + sel.id)}
            className="hv-ficha"
            style={{ alignSelf: 'flex-start', marginTop: 6, padding: '11px 20px', background: '#16191E', color: '#F3EFE7', border: 'none', borderRadius: 8, fontFamily: FD, fontWeight: 700, fontSize: 16, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer' }}
          >
            Ver ficha completa →
          </button>
        </div>
      </div>
    </>
  )
}
