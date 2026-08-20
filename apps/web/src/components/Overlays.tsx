import type { CSSProperties } from 'react'
import { pasosTour, useDemo } from '../lib/demo'
import { FD } from '../lib/estilos'

// Overlays portados 1:1 del demo original: tour con spotlight, tooltip
// flotante, confirmación de instalación y toast inferior centrado.

export function TourOverlay() {
  const { tourStep, tourRect, goTour, endTour } = useDemo()
  if (tourStep < 0 || tourStep >= pasosTour.length) return null
  const st = pasosTour[tourStep]
  const r = tourRect
  const vw = window.innerWidth
  const vh = window.innerHeight

  let spotStyle: CSSProperties
  let cardStyle: CSSProperties
  if (r) {
    spotStyle = {
      position: 'fixed', left: r.x - 6, top: r.y - 6, width: r.w + 12, height: r.h + 12,
      borderRadius: 14, boxShadow: '0 0 0 9999px var(--bg-overlay)', border: '2px solid #C5A059',
      zIndex: 90, pointerEvents: 'none', transition: 'all 0.3s ease',
    }
    let left: number
    let top: number
    if (r.h > vh - 320) {
      left = Math.min(r.x + r.w + 18, vw - 376)
      top = Math.max(16, Math.min(140, vh - 340))
    } else {
      top = r.y + r.h + 18
      if (top > vh - 300) top = Math.max(16, r.y - 320)
      left = Math.min(Math.max(16, r.x), vw - 376)
    }
    cardStyle = {
      position: 'fixed', left, top, width: 'min(360px,calc(100vw - 32px))', background: 'var(--bg-glass)',
      backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
      borderRadius: 14, padding: 22, zIndex: 95, boxShadow: '0 20px 50px rgba(0,0,0,0.35)',
      transition: 'all 0.3s ease',
    }
  } else {
    spotStyle = { position: 'fixed', inset: 0, background: 'var(--bg-overlay)', zIndex: 90, pointerEvents: 'none' }
    cardStyle = {
      position: 'fixed', left: '50%', top: '50%', transform: 'translate(-50%,-50%)',
      width: 'min(400px,calc(100vw - 32px))', background: 'var(--bg-glass)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderRadius: 14, padding: 22,
      zIndex: 95, boxShadow: '0 20px 50px rgba(0,0,0,0.35)',
    }
  }

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 89 }} />
      <div style={spotStyle} />
      <div style={cardStyle} role="dialog" aria-label={`Paso ${tourStep + 1} de ${pasosTour.length}: ${st.title}`}>
        <div style={{ height: 5, background: 'repeating-linear-gradient(135deg,#C5A059 0 12px,#16191E 12px 24px)', borderRadius: '14px 14px 0 0', margin: '-22px -22px 14px' }} />
        <div style={{ fontFamily: FD, fontWeight: 600, fontSize: 13, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--accent-gold)' }}>
          Paso {tourStep + 1} de {pasosTour.length}
        </div>
        <div style={{ fontFamily: FD, fontWeight: 700, fontSize: 26, lineHeight: 1.05, textTransform: 'uppercase', color: 'var(--text-main)', margin: '4px 0 8px' }}>
          {st.title}
        </div>
        <p style={{ margin: '0 0 16px', fontSize: 14.5, lineHeight: 1.55, color: 'var(--text-muted)' }}>{st.body}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
          {pasosTour.map((_, i) => (
            <span
              key={i}
              style={{
                width: i === tourStep ? 20 : 7, height: 7, borderRadius: 999,
                background: i === tourStep ? '#C5A059' : i < tourStep ? '#C9C2B2' : '#EAE6DC',
                transition: 'all 0.25s ease', flex: 'none',
              }}
            />
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={endTour}
            className="hv-ink-texto"
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', padding: '8px 4px' }}
          >
            Saltar tutorial
          </button>
          <span style={{ flex: 1 }} />
          {tourStep > 0 && (
            <button
              onClick={() => goTour(tourStep - 1)}
              className="hv-borde-ink"
              style={{ background: 'var(--bg-glass)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '10px 16px', borderRadius: 8, fontSize: 13.5, fontWeight: 700, cursor: 'pointer' }}
            >
              ← Atrás
            </button>
          )}
          <button
            onClick={() => goTour(tourStep + 1)}
            className="hv-naranja"
            style={{ background: 'var(--accent-gold)', border: 'none', color: 'var(--text-main)', padding: '10px 20px', borderRadius: 8, fontFamily: FD, fontSize: 16, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer' }}
          >
            {tourStep === pasosTour.length - 1 ? '¡Arrancar!' : 'Siguiente →'}
          </button>
        </div>
      </div>
    </>
  )
}

export function TipFlotante() {
  const { tip } = useDemo()
  if (!tip) return null
  return (
    <div
      role="tooltip"
      style={{
        position: 'fixed',
        left: Math.min(Math.max(8, tip.x - 130), window.innerWidth - 275),
        top: tip.y,
        width: 260,
        background: 'var(--accent-gold)',
        color: 'var(--text-main)',
        fontSize: 13,
        lineHeight: 1.5,
        padding: '10px 13px',
        borderRadius: 9,
        zIndex: 99,
        pointerEvents: 'none',
        boxShadow: '0 8px 20px rgba(0,0,0,0.3)',
        borderLeft: '3px solid #C5A059',
      }}
    >
      {tip.text}
    </div>
  )
}

export function ConfirmarModal() {
  const { confirmar, setConfirmar } = useDemo()
  if (!confirmar) return null
  const ok = () => {
    void confirmar.alConfirmar()
    setConfirmar(null)
  }
  return (
    <div
      onClick={() => setConfirmar(null)}
      style={{ position: 'fixed', inset: 0, background: 'var(--bg-overlay)', zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Confirmar instalación"
        style={{ background: 'var(--bg-glass)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderRadius: 14, maxWidth: 480, width: '100%', padding: 26, boxShadow: '0 20px 60px rgba(0,0,0,0.35)', borderTop: '5px solid #C5A059', animation: 'fadeUp 0.2s ease' }}
      >
        <h3 style={{ fontFamily: FD, fontWeight: 700, fontSize: 22, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--text-main)', margin: '0 0 10px' }}>
          Confirmar instalación
        </h3>
        <p style={{ margin: '0 0 6px', fontSize: 15, lineHeight: 1.55, color: 'var(--text-muted)' }}>
          Vas a cambiar el estado de la pieza <strong style={{ color: 'var(--text-main)' }}>{confirmar.pieza}</strong> del
          tracto <strong style={{ color: 'var(--accent-gold)' }}>{confirmar.destino}</strong> a{' '}
          <strong style={{ color: '#2C7A44' }}>Instalado</strong>.
        </p>
        <p style={{ margin: '0 0 20px', fontSize: 15, fontWeight: 600, color: 'var(--text-main)' }}>¿Es correcto?</p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            onClick={() => setConfirmar(null)}
            className="hv-crema"
            style={{ padding: '10px 18px', background: 'var(--bg-glass)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid var(--border-color)', borderRadius: 8, fontSize: 14, fontWeight: 700, color: 'var(--text-main)', cursor: 'pointer' }}
          >
            Cancelar
          </button>
          <button
            onClick={ok}
            className="hv-verde"
            style={{ padding: '10px 20px', background: '#2C7A44', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, color: 'var(--text-main)', cursor: 'pointer' }}
          >
            Sí, marcar instalada
          </button>
        </div>
      </div>
    </div>
  )
}

export function ToastAviso() {
  const { toastMsg } = useDemo()
  if (!toastMsg) return null
  return (
    <div
      role="status"
      style={{
        position: 'fixed',
        bottom: 24,
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'var(--accent-gold)',
        color: 'var(--text-main)',
        borderRadius: 10,
        padding: '14px 22px',
        fontSize: 14.5,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
        animation: 'toastIn 0.25s ease',
        zIndex: 50,
        borderLeft: '4px solid #C5A059',
      }}
    >
      <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#3FA65C', flex: 'none' }} />
      {toastMsg}
    </div>
  )
}
