import { Menu, X } from 'lucide-react'
import { useState } from 'react'
import { Navigate, Outlet } from 'react-router'
import { useSesion } from '../lib/session'
import NavLateral from './NavLateral'

export default function AppLayout() {
  const { sesion } = useSesion()
  const [abierto, setAbierto] = useState(false)
  if (!sesion) return <Navigate to="/login" replace />

  return (
    <div className="min-h-screen md:flex">
      <header className="flex items-center justify-between bg-wh-ink px-4 py-3 md:hidden">
        <p className="font-display text-xl font-bold uppercase tracking-wide text-wh-orange">
          Warhorse
        </p>
        <button
          onClick={() => setAbierto((a) => !a)}
          aria-expanded={abierto}
          aria-label={abierto ? 'Cerrar menú' : 'Abrir menú'}
          className="rounded-md p-2 text-wh-on-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-wh-orange-focus"
        >
          {abierto ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
        </button>
      </header>

      {abierto && (
        <div
          className="fixed inset-0 z-40 bg-wh-ink/50 md:hidden"
          onClick={() => setAbierto(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`${
          abierto ? 'fixed inset-y-0 left-0 z-50 flex w-64' : 'hidden'
        } bg-wh-ink md:static md:z-auto md:flex md:w-60 md:shrink-0 md:flex-col`}
      >
        <NavLateral onNavegar={() => setAbierto(false)} />
      </aside>

      <main className="min-w-0 flex-1 bg-wh-bg p-4 md:p-8">
        <Outlet />
      </main>
    </div>
  )
}
