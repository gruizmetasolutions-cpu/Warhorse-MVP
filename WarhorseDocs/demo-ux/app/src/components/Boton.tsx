import type { ButtonHTMLAttributes, ReactNode, Ref } from 'react'

const variantes = {
  primario:
    'bg-wh-orange hover:bg-wh-orange-hover text-white shadow-[0_4px_12px_rgba(242,98,15,0.35)]',
  oscuro: 'bg-wh-ink hover:bg-black text-wh-on-dark',
  outline: 'border border-wh-border text-wh-muted bg-transparent hover:bg-wh-chip-neutral',
}

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: keyof typeof variantes
  cargando?: boolean
  children: ReactNode
  ref?: Ref<HTMLButtonElement>
}

export default function Boton({
  variante = 'primario',
  cargando = false,
  disabled,
  children,
  className = '',
  ...rest
}: Props) {
  return (
    <button
      disabled={disabled || cargando}
      className={`inline-flex items-center justify-center gap-2 font-display font-bold uppercase tracking-wide px-5 py-3 rounded-[9px] transition-transform hover:-translate-y-px focus:outline-none focus-visible:ring-4 focus-visible:ring-wh-orange-focus disabled:opacity-50 disabled:shadow-none disabled:hover:translate-y-0 ${variantes[variante]} ${className}`}
      {...rest}
    >
      {cargando && (
        <span
          className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
          aria-hidden="true"
        />
      )}
      {children}
    </button>
  )
}
