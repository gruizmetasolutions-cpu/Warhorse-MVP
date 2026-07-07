import { FlaskConical } from 'lucide-react'
import { useId } from 'react'
import { useEscenario } from '../lib/escenario'
import type { Escenario } from '../lib/mock/scenarios'

// Widget de dev para la sesión de validación (doc 09 §5.2): conmuta los
// escenarios lista-vacía y error-de-red sin tocar código.
export default function SelectorEscenario() {
  const { escenario, cambiar } = useEscenario()
  const id = useId()
  return (
    <div className="fixed bottom-4 left-4 z-[55] flex items-center gap-2 rounded-full border border-wh-border bg-wh-surface py-1.5 pr-3 pl-2 text-xs shadow-[0_2px_8px_rgba(0,0,0,0.15)]">
      <FlaskConical size={14} className="text-wh-orange" aria-hidden="true" />
      <label htmlFor={id} className="font-display font-semibold uppercase tracking-wider text-wh-muted-2">
        Escenario
      </label>
      <select
        id={id}
        value={escenario}
        onChange={(e) => cambiar(e.target.value as Escenario)}
        className="rounded-md border border-wh-border bg-white px-1.5 py-1 focus:border-wh-orange focus:outline-none focus-visible:ring-2 focus-visible:ring-wh-orange-focus"
      >
        <option value="normal">Normal</option>
        <option value="vacio">Lista vacía</option>
        <option value="error">Error de red</option>
      </select>
    </div>
  )
}
