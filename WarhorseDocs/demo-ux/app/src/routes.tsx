import { Navigate, Route, Routes } from 'react-router'
import AppLayout from './components/AppLayout'
import { DemoProvider } from './lib/demo'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Ficha from './pages/Ficha'
import Requisicion from './pages/Requisicion'
import Compras from './pages/Compras'
import Catalogo from './pages/Catalogo'
import Usuarios from './pages/Usuarios'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<AppLayout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/ficha/:id" element={<Ficha />} />
        <Route path="/requisicion" element={<Requisicion />} />
        <Route path="/compras" element={<Compras />} />
        <Route path="/catalogo" element={<Catalogo />} />
        <Route path="/usuarios" element={<Usuarios />} />
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <DemoProvider>
      <AppRoutes />
    </DemoProvider>
  )
}
