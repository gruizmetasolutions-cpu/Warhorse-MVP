import { Navigate, Outlet, useLocation, useNavigate } from 'react-router'
import { useDemo } from '../lib/demo'
import { FD } from '../lib/estilos'
import Camion from './Camion'
import { ConfirmarModal, TipFlotante, ToastAviso, TourOverlay } from './Overlays'

const navDefs = [
  { id: 'dashboard', label: 'Tablero' },
  { id: 'requisicion', label: 'Requisición' },
  { id: 'taller', label: 'Taller' },
  { id: 'compras', label: 'Compras' },
  { id: 'diesel', label: 'Diésel' },
  { id: 'catalogo', label: 'Catálogo' },
  { id: 'usuarios', label: 'Usuarios' },
  { id: 'reportes', label: 'Reportes' },
]

export default function AppLayout() {
  const { usuarioActual, goTour, sesion, salir } = useDemo()
  const navigate = useNavigate()
  const { pathname } = useLocation()

  // Guarda de sesión: sin token no hay app (la seguridad real es server-side)
  if (!sesion) return <Navigate to="/login" replace />

  // La navegación visible depende de la matriz de permisos (RF-USR-03)
  const visibles = navDefs.filter((n) => sesion.permisos[n.id])

  const activo = (id: string) =>
    pathname.startsWith('/' + id) || (id === 'dashboard' && pathname.startsWith('/ficha'))

  return (
    <div style={{ minHeight: '100vh', width: '100%', maxWidth: '100%', display: 'flex', alignItems: 'stretch', overflowX: 'hidden' }}>
      <aside
        style={{
          width: 236, flex: 'none', background: '#14181D', color: '#F3EFE7',
          display: 'flex', flexDirection: 'column', padding: '0 0 18px', gap: 22,
          position: 'sticky', top: 0, height: '100vh',
        }}
      >
        <div style={{ height: 6, background: 'repeating-linear-gradient(135deg,#F2620F 0 12px,#14181D 12px 24px)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '4px 20px' }}>
          <Camion stroke="#F2620F" strokeWidth={9} style={{ width: 46, flex: 'none' }} />
          <div style={{ fontFamily: FD, fontWeight: 700, fontSize: 19, lineHeight: 1.05, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Hub de Gastos
            <br />
            <span style={{ color: '#8A8374', fontWeight: 600, fontSize: 13, letterSpacing: '0.14em' }}>
              WarHorse México
            </span>
          </div>
        </div>
        <nav data-tour="nav" style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '0 12px' }}>
          {visibles.map((n) => {
            const act = activo(n.id)
            return (
              <button
                key={n.id}
                onClick={() => navigate('/' + n.id)}
                className={act ? undefined : 'hv-nav'}
                style={{
                  background: act ? 'rgba(242,98,15,0.16)' : 'transparent',
                  border: 'none',
                  borderLeft: act ? '3px solid #F2620F' : '3px solid transparent',
                  color: act ? '#F2620F' : '#B8B2A6',
                  padding: '12px 16px',
                  borderRadius: '0 8px 8px 0',
                  fontSize: 16,
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: FD,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  textAlign: 'left',
                  width: '100%',
                }}
              >
                {n.label}
              </button>
            )
          })}
        </nav>
        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 12, borderTop: '1px solid rgba(243,239,231,0.12)', padding: '16px 20px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 12.5, color: '#8A8374' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#3FA65C', animation: 'pulse 2s infinite', flex: 'none' }} />
            Sesión activa · Hub v1
          </div>
          <span style={{ fontSize: 13.5, color: '#DDD7CB', lineHeight: 1.4, fontWeight: 500 }}>{usuarioActual}</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => goTour(0)}
              className="hv-borde-naranja"
              style={{ background: 'transparent', border: '1px solid rgba(243,239,231,0.18)', color: '#B8B2A6', padding: '8px 12px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
            >
              ▶ Tutorial
            </button>
            <button
              onClick={salir}
              className="hv-claro"
              style={{ background: 'rgba(243,239,231,0.1)', border: '1px solid rgba(243,239,231,0.18)', color: '#F3EFE7', padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
            >
              Salir
            </button>
          </div>
        </div>
      </aside>

      <main
        style={{
          flex: '1 1 auto', minWidth: 0, width: '100%', maxWidth: '100%', padding: 30, margin: '0 auto',
          display: 'flex', flexDirection: 'column', gap: 22, alignSelf: 'flex-start', overflowX: 'hidden', boxSizing: 'border-box',
        }}
      >
        <Outlet />
      </main>

      <TourOverlay />
      <TipFlotante />
      <ConfirmarModal />
      <ToastAviso />
    </div>
  )
}
