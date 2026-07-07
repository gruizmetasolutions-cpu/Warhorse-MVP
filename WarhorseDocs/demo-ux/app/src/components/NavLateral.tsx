import { LayoutDashboard, LogOut, PlayCircle, ShoppingCart, Truck, Users, Wrench } from 'lucide-react'
import { NavLink, useNavigate } from 'react-router'
import { useSesion } from '../lib/session'
import type { Permisos } from '../lib/types'
import Avatar from './Avatar'

const modulos: { clave: keyof Permisos; texto: string; ruta: string; Icono: typeof Truck }[] = [
  { clave: 'dashboard', texto: 'Tablero', ruta: '/dashboard', Icono: LayoutDashboard },
  { clave: 'requisicion', texto: 'Requisición', ruta: '/requisicion', Icono: Wrench },
  { clave: 'compras', texto: 'Compras', ruta: '/compras', Icono: ShoppingCart },
  { clave: 'catalogo', texto: 'Catálogo', ruta: '/catalogo', Icono: Truck },
  { clave: 'usuarios', texto: 'Usuarios', ruta: '/usuarios', Icono: Users },
]

const nombreRol: Record<string, string> = {
  admin: 'Dirección',
  taller: 'Taller',
  compras: 'Compras',
  diesel: 'Diésel',
}

export default function NavLateral({ onNavegar }: { onNavegar?: () => void }) {
  const { sesion, salir } = useSesion()
  const navigate = useNavigate()
  if (!sesion) return null

  const cerrarSesion = () => {
    salir()
    navigate('/login')
  }

  return (
    <nav aria-label="Navegación principal" className="flex h-full flex-col" data-tour="nav">
      <div className="px-5 py-6">
        <p className="font-display text-2xl font-bold uppercase tracking-wide text-wh-orange">
          Warhorse
        </p>
        <p className="font-display text-[13px] font-semibold uppercase tracking-[0.18em] text-wh-nav-idle">
          Hub de Gastos
        </p>
      </div>
      <ul className="flex flex-1 flex-col gap-1">
        {modulos
          .filter((m) => sesion.permisos[m.clave])
          .map(({ clave, texto, ruta, Icono }) => (
            <li key={clave}>
              <NavLink
                to={ruta}
                onClick={onNavegar}
                className={({ isActive }) =>
                  `flex items-center gap-3 border-l-[3px] px-5 py-3 font-display font-semibold uppercase tracking-wider transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-wh-orange-focus ${
                    isActive
                      ? 'border-wh-orange bg-wh-orange-04 text-wh-orange'
                      : 'border-transparent text-wh-nav-idle hover:text-wh-on-dark'
                  }`
                }
              >
                <Icono size={20} aria-hidden="true" />
                {texto}
              </NavLink>
            </li>
          ))}
      </ul>
      <div className="border-t border-white/10 px-5 py-4">
        <div className="flex items-center gap-3">
          <Avatar nombre={sesion.usuario.nombre} rol={sesion.usuario.rol} />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-wh-on-dark">{sesion.usuario.nombre}</p>
            <p className="font-display text-xs font-semibold uppercase tracking-wider text-wh-nav-idle">
              {nombreRol[sesion.usuario.rol]}
            </p>
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('wh-abrir-tour'))}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-[9px] border border-white/15 px-2 py-2 font-display text-xs font-semibold uppercase tracking-wider text-wh-nav-idle hover:text-wh-on-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-wh-orange-focus"
          >
            <PlayCircle size={16} aria-hidden="true" />
            Tutorial
          </button>
          <button
            onClick={cerrarSesion}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-[9px] border border-white/15 px-2 py-2 font-display text-xs font-semibold uppercase tracking-wider text-wh-nav-idle hover:text-wh-on-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-wh-orange-focus"
          >
            <LogOut size={16} aria-hidden="true" />
            Salir
          </button>
        </div>
      </div>
    </nav>
  )
}
