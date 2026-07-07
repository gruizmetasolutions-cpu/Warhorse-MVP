import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'

interface Aviso {
  id: number
  mensaje: string
  variante: 'ok' | 'error'
}

const Ctx = createContext<{ avisar: (mensaje: string, variante?: 'ok' | 'error') => void } | null>(null)

let contador = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [avisos, setAvisos] = useState<Aviso[]>([])

  const avisar = useCallback((mensaje: string, variante: 'ok' | 'error' = 'ok') => {
    const id = ++contador
    setAvisos((a) => [...a, { id, mensaje, variante }])
    // Permanencia ~3.2s (doc 08 §9)
    setTimeout(() => setAvisos((a) => a.filter((x) => x.id !== id)), 3200)
  }, [])

  return (
    <Ctx.Provider value={{ avisar }}>
      {children}
      <div
        className="fixed right-4 bottom-16 z-[60] flex flex-col gap-2"
        role="status"
        aria-live="polite"
      >
        {avisos.map((a) => (
          <div
            key={a.id}
            className={`max-w-sm rounded-[9px] px-4 py-3 text-sm font-semibold shadow-lg transition-opacity duration-200 ${
              a.variante === 'error'
                ? 'border border-wh-orange bg-wh-orange-soft text-wh-orange-ink'
                : 'bg-wh-ink text-wh-on-dark'
            }`}
          >
            {a.mensaje}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  )
}

export function useToast() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useToast requiere ToastProvider')
  return ctx
}
