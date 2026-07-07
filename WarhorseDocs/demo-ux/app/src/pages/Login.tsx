import { useNavigate } from 'react-router'
import { useSesion, type RolDemo } from '../lib/session'

// Placeholder Task 3 — se sustituye por el login de dos columnas en Task 6.
export default function Login() {
  const { entrar } = useSesion()
  const navigate = useNavigate()

  const conRol = async (rol: RolDemo) => {
    const s = await entrar(rol)
    navigate('/' + s.landing)
  }

  return (
    <main>
      <h1>Iniciar sesión</h1>
      <button onClick={() => void conRol('admin')}>Dirección</button>
      <button onClick={() => void conRol('taller')}>Taller</button>
      <button onClick={() => void conRol('compras')}>Compras</button>
    </main>
  )
}
