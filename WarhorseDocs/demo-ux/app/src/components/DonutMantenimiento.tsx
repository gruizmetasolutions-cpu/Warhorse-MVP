// Donut de mantenimiento (doc 08 §5.8): % Reparación Total (verde) vs.
// Mejoralito (naranja). El color nunca es el único portador: leyenda textual.
export default function DonutMantenimiento({
  pctTotal,
  pctMejoralito,
}: {
  pctTotal: number
  pctMejoralito: number
}) {
  const r = 40
  const c = 2 * Math.PI * r
  return (
    <div
      role="img"
      aria-label={`Mantenimiento: ${pctTotal}% reparación total, ${pctMejoralito}% mejoralito`}
      className="flex items-center justify-center gap-6"
    >
      <svg viewBox="0 0 100 100" className="w-28 shrink-0" aria-hidden="true">
        <circle cx="50" cy="50" r={r} fill="none" stroke="#F2620F" strokeWidth="14" />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke="#3FA65C"
          strokeWidth="14"
          strokeDasharray={`${(pctTotal / 100) * c} ${c}`}
          transform="rotate(-90 50 50)"
        />
        <text
          x="50"
          y="57"
          textAnchor="middle"
          fontFamily="Barlow Condensed, Barlow, sans-serif"
          fontWeight="700"
          fontSize="22"
          fill="#16191E"
        >
          {pctTotal}%
        </text>
      </svg>
      <ul className="space-y-1.5 text-sm">
        <li className="flex items-center gap-2">
          <span className="size-3 rounded-full bg-wh-green" aria-hidden="true" />
          Reparación total <strong className="tabular-nums">{pctTotal}%</strong>
        </li>
        <li className="flex items-center gap-2">
          <span className="size-3 rounded-full bg-wh-orange" aria-hidden="true" />
          Mejoralito <strong className="tabular-nums">{pctMejoralito}%</strong>
        </li>
      </ul>
    </div>
  )
}
