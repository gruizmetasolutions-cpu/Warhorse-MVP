import type { ReactNode } from 'react'
import Boton from './Boton'
import EstadoVacio from './EstadoVacio'
import Skeleton from './Skeleton'

export interface Columna<T> {
  titulo: string
  alinear?: 'right'
  render: (fila: T, indice: number) => ReactNode
}

interface Props<T> {
  etiqueta: string
  columnas: Columna<T>[]
  filas: T[] | null
  cargando: boolean
  error: string | null
  onReintentar: () => void
  onFila?: (fila: T) => void
  textoVacio: string
  claveFila: (fila: T) => string | number
}

export default function Tabla<T>({
  etiqueta,
  columnas,
  filas,
  cargando,
  error,
  onReintentar,
  onFila,
  textoVacio,
  claveFila,
}: Props<T>) {
  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 py-10 text-center">
        <p className="font-semibold text-wh-orange-ink">{error}</p>
        <Boton variante="outline" onClick={onReintentar}>
          Reintentar
        </Boton>
      </div>
    )
  }
  if (!cargando && filas && filas.length === 0) {
    return <EstadoVacio mensaje={textoVacio} />
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm" aria-label={etiqueta}>
        <thead>
          <tr>
            {columnas.map((c) => (
              <th
                key={c.titulo}
                scope="col"
                className={`px-3 py-2 font-display text-[13px] font-semibold uppercase tracking-wider text-wh-muted-2 ${
                  c.alinear === 'right' ? 'text-right' : ''
                }`}
              >
                {c.titulo}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {cargando
            ? Array.from({ length: 4 }, (_, i) => (
                <tr key={i} className="border-b border-wh-border-soft">
                  {columnas.map((c) => (
                    <td key={c.titulo} className="px-3 py-3.5">
                      <Skeleton className="h-4 w-full max-w-32" />
                    </td>
                  ))}
                </tr>
              ))
            : filas?.map((f, i) => (
                <tr
                  key={claveFila(f)}
                  className={`border-b border-wh-border-soft ${
                    onFila
                      ? 'cursor-pointer hover:bg-wh-bg/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-wh-orange-focus'
                      : ''
                  }`}
                  tabIndex={onFila ? 0 : undefined}
                  onClick={onFila ? () => onFila(f) : undefined}
                  onKeyDown={
                    onFila
                      ? (e) => {
                          if (e.key === 'Enter') onFila(f)
                        }
                      : undefined
                  }
                >
                  {columnas.map((c) => (
                    <td
                      key={c.titulo}
                      className={`px-3 py-3.5 align-middle ${
                        c.alinear === 'right'
                          ? 'text-right font-display text-base font-bold tabular-nums'
                          : ''
                      }`}
                    >
                      {c.render(f, i)}
                    </td>
                  ))}
                </tr>
              ))}
        </tbody>
      </table>
    </div>
  )
}
