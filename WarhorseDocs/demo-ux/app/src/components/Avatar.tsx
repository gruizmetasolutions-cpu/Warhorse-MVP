import type { Rol } from '../lib/types'

// Color por rol (doc 08 §5.7): admin ink, taller naranja, compras verde.
const colorRol: Record<Rol, string> = {
  admin: '#16191E',
  taller: '#F2620F',
  compras: '#3FA65C',
  diesel: '#8A6D1A',
}

export default function Avatar({
  nombre,
  rol,
  suspendido = false,
}: {
  nombre: string
  rol: Rol
  suspendido?: boolean
}) {
  const iniciales = nombre
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
  return (
    <span
      className="inline-flex size-9 shrink-0 items-center justify-center rounded-full font-display text-sm font-bold text-white"
      style={{ backgroundColor: colorRol[rol], opacity: suspendido ? 0.45 : 1 }}
      aria-hidden="true"
    >
      {iniciales}
    </span>
  )
}
