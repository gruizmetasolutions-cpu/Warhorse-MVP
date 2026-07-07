import { useEffect, useRef, type ReactNode } from 'react'
import Boton from './Boton'

interface Props {
  abierto: boolean
  titulo: string
  onCerrar: () => void
  onConfirmar: () => void
  textoConfirmar: string
  confirmando?: boolean
  children: ReactNode
}

export default function Modal({
  abierto,
  titulo,
  onCerrar,
  onConfirmar,
  textoConfirmar,
  confirmando = false,
  children,
}: Props) {
  const panelRef = useRef<HTMLDivElement>(null)
  const focoPrevio = useRef<HTMLElement | null>(null)
  const onCerrarRef = useRef(onCerrar)

  useEffect(() => {
    onCerrarRef.current = onCerrar
  }, [onCerrar])

  // La trampa de foco depende SOLO de `abierto`: si dependiera de onCerrar
  // (función nueva en cada render del padre), cada tecleo robaría el foco.
  useEffect(() => {
    if (!abierto) return
    focoPrevio.current = document.activeElement as HTMLElement
    const panel = panelRef.current
    panel?.querySelector<HTMLElement>('input, select, textarea, button')?.focus()

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCerrarRef.current()
      if (e.key === 'Tab' && panel) {
        const focables = panel.querySelectorAll<HTMLElement>('button, [href], input, select, textarea')
        if (!focables.length) return
        const primero = focables[0]
        const ultimo = focables[focables.length - 1]
        if (e.shiftKey && document.activeElement === primero) {
          e.preventDefault()
          ultimo.focus()
        } else if (!e.shiftKey && document.activeElement === ultimo) {
          e.preventDefault()
          primero.focus()
        }
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      focoPrevio.current?.focus()
    }
  }, [abierto])

  if (!abierto) return null
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-wh-ink/50 p-4"
      onClick={onCerrar}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        className="w-full max-w-md rounded-[13px] bg-wh-surface p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-display text-[19px] font-bold uppercase">{titulo}</h3>
        <div className="mt-3">{children}</div>
        <div className="mt-6 flex justify-end gap-3">
          <Boton variante="outline" onClick={onCerrar}>
            Cancelar
          </Boton>
          <Boton onClick={onConfirmar} cargando={confirmando}>
            {textoConfirmar}
          </Boton>
        </div>
      </div>
    </div>
  )
}
