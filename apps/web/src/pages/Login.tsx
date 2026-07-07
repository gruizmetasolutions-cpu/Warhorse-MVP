import { useNavigate } from 'react-router'
import Camion from '../components/Camion'
import { useDemo } from '../lib/demo'
import { FD } from '../lib/estilos'
import type { Rol } from '../lib/types'

const roles: { rol: Rol; nombre: string; desc: string }[] = [
  { rol: 'taller', nombre: 'Edgar Fraga', desc: 'Taller — requisiciones y registro de yonke' },
  { rol: 'compras', nombre: 'Montzay Vázquez', desc: 'Compras — gestión de pedidos' },
  { rol: 'admin', nombre: 'Dirección', desc: 'Tablero directivo — decisión por tracto' },
]

const puntos = [
  'Costo real por unidad: diésel + refacciones + taller, consolidado.',
  'Piezas del yonke (WH03, WH60) con trazabilidad y costo estimado.',
  '¿Vale la pena meterle más lana? Respuesta en 30 segundos.',
]

export default function Login() {
  const { rol, setRol, goTour } = useDemo()
  const navigate = useNavigate()

  const entrar = () => {
    const landing = rol === 'compras' ? '/compras' : rol === 'taller' ? '/requisicion' : '/dashboard'
    let primeraVez = false
    try {
      primeraVez = !localStorage.getItem('wh_tour_v1')
      if (primeraVez) localStorage.setItem('wh_tour_v1', 'done')
    } catch {
      /* sin localStorage */
    }
    navigate(landing)
    if (primeraVez) setTimeout(() => goTour(0), 500)
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexWrap: 'wrap', background: '#14181D' }}>
      <div style={{ flex: '3 1 440px', color: '#F3EFE7', padding: '64px 56px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 34, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 8, background: 'repeating-linear-gradient(135deg,#F2620F 0 14px,#14181D 14px 28px)' }} />
        <Camion
          stroke="#F2620F"
          strokeWidth={2.5}
          conLinea
          style={{ position: 'absolute', right: -40, bottom: -16, width: 420, opacity: 0.1 }}
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 34, height: 4, background: '#F2620F' }} />
            <span style={{ fontFamily: FD, fontWeight: 600, fontSize: 15, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#F2620F' }}>
              WarHorse México · Dataholics
            </span>
          </div>
          <h1 style={{ fontFamily: FD, fontWeight: 700, fontSize: 'clamp(40px,5.5vw,68px)', lineHeight: 0.98, margin: 0, maxWidth: 560, textTransform: 'uppercase', letterSpacing: '0.01em' }}>
            Hub de Gastos
            <br />
            por Tracto
          </h1>
          <p style={{ fontSize: 18, color: '#B8B2A6', margin: 0, fontWeight: 500 }}>
            Cada peso que se traga un tracto, a la vista. Diésel, refacciones y taller en un solo lugar.
          </p>
        </div>
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 480 }}>
          {puntos.map((p, i) => (
            <li key={i} style={{ display: 'flex', gap: 14, alignItems: 'baseline', fontSize: 16, color: '#DDD7CB' }}>
              <span style={{ fontFamily: FD, fontWeight: 700, color: '#F2620F', fontSize: 18, flex: 'none' }}>
                {'0' + (i + 1)}
              </span>
              {p}
            </li>
          ))}
        </ul>
      </div>

      <div style={{ flex: '2 1 360px', background: '#F3EFE7', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 36px', position: 'relative' }}>
        <div style={{ width: '100%', maxWidth: 390, display: 'flex', flexDirection: 'column', gap: 22, animation: 'fadeUp 0.4s ease' }}>
          <div>
            <h2 style={{ fontFamily: FD, fontWeight: 700, fontSize: 30, color: '#16191E', margin: '0 0 6px', textTransform: 'uppercase' }}>
              Entrar al Hub
            </h2>
            <p style={{ fontSize: 14.5, color: '#6F6A60', margin: 0 }}>
              Demo: elige un rol para entrar, sin contraseña real.
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {roles.map((r) => {
              const sel = rol === r.rol
              return (
                <button
                  key={r.rol}
                  onClick={() => setRol(r.rol)}
                  className="hv-borde-naranja-solo"
                  aria-pressed={sel}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                    padding: '13px 16px', borderRadius: 10, cursor: 'pointer', textAlign: 'left',
                    background: '#fff',
                    border: sel ? '2px solid #F2620F' : '1px solid #D8D2C4',
                    boxShadow: sel ? '0 2px 8px rgba(242,98,15,0.18)' : 'none',
                  }}
                >
                  <span style={{ display: 'flex', flexDirection: 'column', gap: 2, textAlign: 'left' }}>
                    <span style={{ fontWeight: 700, fontSize: 15, color: '#16191E' }}>{r.nombre}</span>
                    <span style={{ fontSize: 13, color: '#6F6A60' }}>{r.desc}</span>
                  </span>
                  <span
                    style={{
                      width: 16, height: 16, borderRadius: '50%', flex: 'none',
                      border: sel ? '5px solid #F2620F' : '2px solid #C9C2B2', background: '#fff',
                    }}
                  />
                </button>
              )
            })}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input
              type="text"
              placeholder="Usuario o correo"
              style={{ padding: '13px 14px', border: '1px solid #D8D2C4', borderRadius: 9, fontSize: 15, background: '#fff' }}
            />
            <input
              type="password"
              placeholder="Contraseña"
              style={{ padding: '13px 14px', border: '1px solid #D8D2C4', borderRadius: 9, fontSize: 15, background: '#fff' }}
            />
            <button
              onClick={entrar}
              className="hv-naranja"
              style={{
                padding: 14, background: '#F2620F', color: '#fff', border: 'none', borderRadius: 9,
                fontFamily: FD, fontWeight: 700, fontSize: 18, letterSpacing: '0.08em',
                textTransform: 'uppercase', cursor: 'pointer', boxShadow: '0 4px 12px rgba(242,98,15,0.35)',
              }}
            >
              Arrancar →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
