import { useId } from 'react'
import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react'

interface Base {
  etiqueta: string
  error?: string
  ayuda?: string
}

const claseCampo = (error?: string) =>
  `w-full bg-white border rounded-[9px] px-4 py-3 font-body text-wh-ink focus:outline-none focus-visible:ring-4 focus-visible:ring-wh-orange-focus disabled:opacity-50 ${
    error ? 'border-wh-orange' : 'border-wh-border focus:border-wh-orange'
  }`

function Envoltura({
  etiqueta,
  error,
  ayuda,
  htmlFor,
  children,
}: Base & { htmlFor: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={htmlFor}
        className="font-display text-[13px] font-semibold uppercase tracking-[0.16em] text-wh-muted-2"
      >
        {etiqueta}
      </label>
      {children}
      {ayuda && !error && <p className="text-sm text-wh-muted">{ayuda}</p>}
      {error && (
        <p className="text-sm font-semibold text-wh-orange-ink" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

export function CampoTexto({
  etiqueta,
  error,
  ayuda,
  ...rest
}: Base & InputHTMLAttributes<HTMLInputElement>) {
  const id = useId()
  return (
    <Envoltura etiqueta={etiqueta} error={error} ayuda={ayuda} htmlFor={id}>
      <input id={id} className={claseCampo(error)} aria-invalid={!!error} {...rest} />
    </Envoltura>
  )
}

export function CampoSelect({
  etiqueta,
  error,
  ayuda,
  opciones,
  placeholder,
  ...rest
}: Base & { opciones: { valor: string; texto: string }[]; placeholder?: string } & SelectHTMLAttributes<HTMLSelectElement>) {
  const id = useId()
  return (
    <Envoltura etiqueta={etiqueta} error={error} ayuda={ayuda} htmlFor={id}>
      <select id={id} className={claseCampo(error)} aria-invalid={!!error} {...rest}>
        {placeholder && <option value="">{placeholder}</option>}
        {opciones.map((o) => (
          <option key={o.valor} value={o.valor}>
            {o.texto}
          </option>
        ))}
      </select>
    </Envoltura>
  )
}

export function CampoArea({
  etiqueta,
  error,
  ayuda,
  ...rest
}: Base & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const id = useId()
  return (
    <Envoltura etiqueta={etiqueta} error={error} ayuda={ayuda} htmlFor={id}>
      <textarea id={id} rows={3} className={claseCampo(error)} aria-invalid={!!error} {...rest} />
    </Envoltura>
  )
}
