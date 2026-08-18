import { useState, type CSSProperties } from 'react'
import { useNavigate } from 'react-router'
import Camion from '../components/Camion'
import { ApiError, cambiarPassword } from '../lib/api'
import { rutaDeLanding, useDemo } from '../lib/demo'
import { FD } from '../lib/estilos'

const campo: CSSProperties = { padding: 12, border: '1px solid var(--border-color)', borderRadius: 9, fontSize: 15, background: 'var(--bg-input)', width: '100%' }
const etiqueta: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 6, fontSize: 14, fontWeight: 600 }

// Pantalla de cambio obligatorio en el primer login (alta sin correo). La
// persona entra con la temporal y aquí define su propia contraseña.
export default function DefinirPassword() {
  const { refrescarSesion, salir } = useDemo()
  const navigate = useNavigate()
  const [actual, setActual] = useState('')
  const [nueva, setNueva] = useState('')
  const [confirma, setConfirma] = useState('')
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  const guardar = async () => {
    setError('')
    if (nueva.length < 8) return setError('La nueva contraseña debe tener al menos 8 caracteres.')
    if (nueva !== confirma) return setError('Las contraseñas no coinciden.')
    setEnviando(true)
    try {
      await cambiarPassword({ password_actual: actual, password_nueva: nueva })
      const yo = await refrescarSesion()
      navigate(rutaDeLanding(yo.landing))
    } catch (e) {
      if (e instanceof ApiError) {
        setError(e.status === 401 ? 'La contraseña temporal no es correcta.' : (e.fields ? Object.values(e.fields).flat()[0] ?? e.message : e.message))
      } else {
        setError('No se pudo actualizar la contraseña. Intenta de nuevo.')
      }
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: 'transparent' }}>
      <div style={{ background: 'var(--bg-glass)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderRadius: 16, maxWidth: 440, width: '100%', padding: 32, boxShadow: '0 20px 60px rgba(0,0,0,0.4)', borderTop: '6px solid #C5A059' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 18 }}>
          <Camion stroke="#C5A059" strokeWidth={9} style={{ width: 42, flex: 'none' }} />
          <div style={{ fontFamily: FD, fontWeight: 700, fontSize: 18, lineHeight: 1.05, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-main)' }}>
            Hub de Gastos
          </div>
        </div>
        <h2 style={{ fontFamily: FD, fontWeight: 700, fontSize: 28, letterSpacing: '0.02em', textTransform: 'uppercase', color: 'var(--text-main)', margin: '0 0 6px' }}>
          Define tu contraseña
        </h2>
        <p style={{ margin: '0 0 20px', fontSize: 14, color: 'var(--text-muted)' }}>
          Entraste con una contraseña temporal. Crea la tuya para continuar; la temporal dejará de funcionar.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <label style={etiqueta}>
            Contraseña temporal
            <input type="password" style={campo} value={actual} onChange={(e) => { setActual(e.target.value); setError('') }} />
          </label>
          <label style={etiqueta}>
            Nueva contraseña
            <input type="password" style={campo} value={nueva} onChange={(e) => { setNueva(e.target.value); setError('') }} />
          </label>
          <label style={etiqueta}>
            Confirmar contraseña
            <input type="password" style={campo} value={confirma} onChange={(e) => { setConfirma(e.target.value); setError('') }} />
          </label>
        </div>
        {error && (
          <div role="alert" style={{ marginTop: 14, background: '#FBEBE8', border: '1px solid #E8A99D', color: '#9B2C2C', borderRadius: 9, padding: '12px 14px', fontSize: 14 }}>
            {error}
          </div>
        )}
        <button
          onClick={() => void guardar()}
          disabled={enviando}
          className="hv-naranja"
          style={{ width: '100%', marginTop: 20, padding: '13px 20px', background: 'var(--accent-gold)', color: 'var(--text-main)', border: 'none', borderRadius: 9, fontFamily: FD, fontWeight: 700, fontSize: 17, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer', opacity: enviando ? 0.7 : 1 }}
        >
          Guardar y entrar
        </button>
        <button
          onClick={salir}
          style={{ width: '100%', marginTop: 10, padding: '10px', background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 13.5, fontWeight: 600, cursor: 'pointer' }}
        >
          Cancelar y salir
        </button>
      </div>
    </div>
  )
}
