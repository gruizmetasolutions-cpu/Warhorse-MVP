import { useState } from 'react'
import { useNavigate } from 'react-router'
import Camion from '../components/Camion'
import { ApiError } from '../lib/api'
import { rutaDeLanding, useDemo } from '../lib/demo'
import { FD } from '../lib/estilos'

const puntos = [
  'Costo real por unidad: diésel + refacciones + taller, consolidado.',
  'Piezas del yonke (WH03, WH60) con trazabilidad y costo estimado.',
  '¿Vale la pena meterle más lana? Respuesta en 30 segundos.',
]

export default function Login() {
  const { entrar, goTour } = useDemo()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

  const arrancar = async () => {
    setError('')
    setCargando(true)
    try {
      const yo = await entrar(email.trim(), password)
      let primeraVez = false
      try {
        primeraVez = !localStorage.getItem('wh_tour_v1')
        if (primeraVez) localStorage.setItem('wh_tour_v1', 'done')
      } catch {
        /* sin localStorage */
      }
      navigate(rutaDeLanding(yo.landing))
      if (primeraVez) setTimeout(() => goTour(0), 500)
    } catch (e) {
      if (e instanceof ApiError && e.status === 429) {
        setError('Demasiados intentos; espera un minuto e inténtalo de nuevo.')
      } else if (e instanceof ApiError && e.status === 422) {
        setError('Escribe tu correo y contraseña.')
      } else if (e instanceof ApiError && e.status === 401) {
        setError('Credenciales inválidas.')
      } else {
        setError('No se pudo conectar con el servidor. Intenta de nuevo.')
      }
      setCargando(false)
    }
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
        <form
          style={{ width: '100%', maxWidth: 390, display: 'flex', flexDirection: 'column', gap: 22, animation: 'fadeUp 0.4s ease' }}
          onSubmit={(e) => {
            e.preventDefault()
            void arrancar()
          }}
        >
          <div>
            <h2 style={{ fontFamily: FD, fontWeight: 700, fontSize: 30, color: '#16191E', margin: '0 0 6px', textTransform: 'uppercase' }}>
              Entrar al Hub
            </h2>
            <p style={{ fontSize: 14.5, color: '#6F6A60', margin: 0 }}>
              Accede con la cuenta que te asignó Dirección.
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input
              type="text"
              placeholder="Usuario o correo"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ padding: '13px 14px', border: '1px solid #D8D2C4', borderRadius: 9, fontSize: 15, background: '#fff' }}
            />
            <input
              type="password"
              placeholder="Contraseña"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ padding: '13px 14px', border: '1px solid #D8D2C4', borderRadius: 9, fontSize: 15, background: '#fff' }}
            />
            <button
              type="submit"
              disabled={cargando}
              className="hv-naranja"
              style={{
                padding: 14, background: '#F2620F', color: '#fff', border: 'none', borderRadius: 9,
                fontFamily: FD, fontWeight: 700, fontSize: 18, letterSpacing: '0.08em',
                textTransform: 'uppercase', cursor: 'pointer', boxShadow: '0 4px 12px rgba(242,98,15,0.35)',
                opacity: cargando ? 0.7 : 1,
              }}
            >
              {cargando ? 'Arrancando…' : 'Arrancar →'}
            </button>
            {error && (
              <div role="alert" style={{ background: '#FBEBE8', border: '1px solid #E8A99D', color: '#9B2C2C', borderRadius: 9, padding: '12px 14px', fontSize: 14 }}>
                {error}
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
