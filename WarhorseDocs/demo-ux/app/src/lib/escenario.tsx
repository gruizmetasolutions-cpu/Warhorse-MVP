import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { getEscenario, setEscenario, type Escenario } from './mock/scenarios'

// El cambio de escenario remonta el árbol de rutas (key en AppRoutes) para
// que todas las vistas refetcheen sin perder la sesión (doc 09 §5.2).
const Ctx = createContext<{ escenario: Escenario; cambiar: (e: Escenario) => void } | null>(null)

export function EscenarioProvider({ children }: { children: ReactNode }) {
  const [escenario, setEstado] = useState<Escenario>(getEscenario())
  const cambiar = useCallback((e: Escenario) => {
    setEscenario(e)
    setEstado(e)
  }, [])
  return <Ctx.Provider value={{ escenario, cambiar }}>{children}</Ctx.Provider>
}

export function useEscenario() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useEscenario requiere EscenarioProvider')
  return ctx
}
