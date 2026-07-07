import type { RankingItem } from '../lib/types'

const dinero = (n: number) => '$' + n.toLocaleString('en-US')

// Barras "Gasto por tracto" (doc 08 §5.8): barras ink; la crítica con rayado
// naranja; la seleccionada con outline naranja. Cada barra es navegable.
export default function BarrasGasto({
  ranking,
  seleccionada,
  onSeleccionar,
}: {
  ranking: RankingItem[]
  seleccionada: string
  onSeleccionar: (idUnidad: string) => void
}) {
  const max = Math.max(...ranking.map((r) => r.costo_total), 1)
  return (
    <div
      aria-label={`Gasto por tracto: ${ranking
        .map((r) => `${r.id_unidad} ${dinero(r.costo_total)}`)
        .join(', ')}`}
    >
      <div className="flex h-56 items-end gap-3 md:gap-5">
        {ranking.map((r) => (
          <div key={r.id_unidad} className="flex h-full min-w-0 flex-1 flex-col items-center gap-2">
            <div className="flex w-full flex-1 items-end justify-center">
              <button
                onClick={() => onSeleccionar(r.id_unidad)}
                aria-label={`${r.id_unidad}: ${dinero(r.costo_total)}${
                  r.critico ? ' — tracto más costoso' : ''
                }`}
                aria-pressed={r.id_unidad === seleccionada}
                className={`w-full max-w-14 animate-[growBar_0.5s_ease] rounded-t-md transition-[height] duration-300 focus:outline-none focus-visible:ring-4 focus-visible:ring-wh-orange-focus ${
                  r.id_unidad === seleccionada ? 'outline-2 outline-offset-2 outline-wh-orange' : ''
                }`}
                style={{
                  height: `${Math.max((r.costo_total / max) * 100, 4)}%`,
                  background: r.critico
                    ? 'repeating-linear-gradient(45deg, #F2620F, #F2620F 6px, #D9550C 6px, #D9550C 12px)'
                    : '#16191E',
                }}
              />
            </div>
            <span className="font-display text-xs font-semibold uppercase tracking-wider">
              {r.id_unidad}
            </span>
            <span className="hidden font-display text-sm font-bold tabular-nums sm:block">
              {dinero(r.costo_total)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
