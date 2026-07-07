import type { ReactNode } from 'react'

export default function Panel({
  titulo,
  children,
  className = '',
  dataTour,
}: {
  titulo?: string
  children: ReactNode
  className?: string
  dataTour?: string
}) {
  return (
    <section
      data-tour={dataTour}
      className={`rounded-[13px] bg-wh-surface p-5 shadow-[0_2px_8px_rgba(0,0,0,0.05)] ${className}`}
    >
      {titulo && <h3 className="mb-4 font-display text-[19px] font-bold uppercase">{titulo}</h3>}
      {children}
    </section>
  )
}
