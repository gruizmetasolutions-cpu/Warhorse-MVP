import Skeleton from './Skeleton'

export default function KpiCard({
  etiqueta,
  valor,
  cargando = false,
}: {
  etiqueta: string
  valor: string | null
  cargando?: boolean
}) {
  return (
    <div className="bg-wh-surface rounded-[13px] shadow-[0_2px_8px_rgba(0,0,0,0.05)] p-5">
      <p className="font-display text-[13px] font-semibold uppercase tracking-[0.16em] text-wh-muted-2">
        {etiqueta}
      </p>
      {cargando ? (
        <Skeleton className="mt-2 h-9 w-28" />
      ) : (
        <p className="mt-1 font-display text-[38px] font-bold leading-none tabular-nums">
          {valor ?? '—'}
        </p>
      )}
    </div>
  )
}
