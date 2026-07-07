import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import * as api from './api'
import type { Sesion } from './types'

export type RolDemo = 'admin' | 'taller' | 'compras'

// El login del demo solo fija el rol activo (doc 09 §1): cada rol usa
// el email de su persona de referencia en los fixtures.
export const emailPorRol: Record<RolDemo, string> = {
  admin: 'direccion@warhorse.mx',
  taller: 'edgar@warhorse.mx',
  compras: 'montzay@warhorse.mx',
}

interface ContextoSesion {
  sesion: Sesion | null
  entrar: (rol: RolDemo) => Promise<Sesion>
  salir: () => void
}

const Ctx = createContext<ContextoSesion | null>(null)

export function SesionProvider({ children }: { children: ReactNode }) {
  const [sesion, setSesion] = useState<Sesion | null>(null)

  const entrar = useCallback(async (rol: RolDemo) => {
    const s = await api.login(emailPorRol[rol], 'demo')
    setSesion(s)
    return s
  }, [])

  const salir = useCallback(() => {
    void api.logout()
    setSesion(null)
  }, [])

  return <Ctx.Provider value={{ sesion, entrar, salir }}>{children}</Ctx.Provider>
}

export function useSesion(): ContextoSesion {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useSesion requiere SesionProvider')
  return ctx
}
