import type { ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router'
import AppLayout from './components/AppLayout'
import { ToastProvider } from './components/Toast'
import { EscenarioProvider, useEscenario } from './lib/escenario'
import { SesionProvider, useSesion } from './lib/session'
import type { Permisos } from './lib/types'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Ficha from './pages/Ficha'
import Requisicion from './pages/Requisicion'
import Compras from './pages/Compras'
import Catalogo from './pages/Catalogo'
import Usuarios from './pages/Usuarios'

function RutaProtegida({ modulo, children }: { modulo?: keyof Permisos; children: ReactNode }) {
  const { sesion } = useSesion()
  if (!sesion) return <Navigate to="/login" replace />
  if (modulo && !sesion.permisos[modulo]) return <Navigate to={'/' + sesion.landing} replace />
  return children
}

function Inicio() {
  const { sesion } = useSesion()
  return <Navigate to={sesion ? '/' + sesion.landing : '/login'} replace />
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<AppLayout />}>
        <Route path="/dashboard" element={<RutaProtegida modulo="dashboard"><Dashboard /></RutaProtegida>} />
        <Route path="/ficha/:id" element={<RutaProtegida><Ficha /></RutaProtegida>} />
        <Route path="/requisicion" element={<RutaProtegida modulo="requisicion"><Requisicion /></RutaProtegida>} />
        <Route path="/compras" element={<RutaProtegida modulo="compras"><Compras /></RutaProtegida>} />
        <Route path="/catalogo" element={<RutaProtegida modulo="catalogo"><Catalogo /></RutaProtegida>} />
        <Route path="/usuarios" element={<RutaProtegida modulo="usuarios"><Usuarios /></RutaProtegida>} />
      </Route>
      <Route path="/" element={<Inicio />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function RutasConEscenario() {
  // El cambio de escenario remonta las rutas para que las vistas refetcheen
  const { escenario } = useEscenario()
  return <AppRoutes key={escenario} />
}

export default function App() {
  return (
    <SesionProvider>
      <ToastProvider>
        <EscenarioProvider>
          <RutasConEscenario />
        </EscenarioProvider>
      </ToastProvider>
    </SesionProvider>
  )
}
