// Gauge de eficiencia (doc 08 §5.8): semicírculo gris→naranja→verde con aguja.
// Único degradado decorativo permitido por la identidad.
export default function Gauge({ kmPorLitro }: { kmPorLitro: number | null }) {
  if (kmPorLitro === null) {
    return <p className="py-8 text-center text-wh-muted">Sin datos suficientes</p>
  }
  const fraccion = Math.min(kmPorLitro / 4, 1)
  const rad = fraccion * Math.PI
  const x = 100 - 70 * Math.cos(rad)
  const y = 100 - 70 * Math.sin(rad)
  return (
    <div role="img" aria-label={`Eficiencia de la unidad: ${kmPorLitro.toFixed(1)} kilómetros por litro`}>
      <svg viewBox="0 0 200 112" className="mx-auto w-full max-w-60" aria-hidden="true">
        <defs>
          <linearGradient id="wh-gauge" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#8A8374" />
            <stop offset="50%" stopColor="#F2620F" />
            <stop offset="100%" stopColor="#3FA65C" />
          </linearGradient>
        </defs>
        <path
          d="M20 100 A80 80 0 0 1 180 100"
          fill="none"
          stroke="url(#wh-gauge)"
          strokeWidth="14"
          strokeLinecap="round"
        />
        <line x1="100" y1="100" x2={x} y2={y} stroke="#16191E" strokeWidth="4" strokeLinecap="round" />
        <circle cx="100" cy="100" r="6" fill="#16191E" />
      </svg>
      <p className="text-center font-display text-3xl font-bold tabular-nums">
        {kmPorLitro.toFixed(1)} <span className="text-base font-semibold text-wh-muted">km/L</span>
      </p>
    </div>
  )
}
