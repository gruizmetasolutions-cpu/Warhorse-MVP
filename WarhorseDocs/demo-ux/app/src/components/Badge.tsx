// Paleta semántica del doc 08 §2.3/§5.3. El azul SOLO aparece en el estado
// "Comprado"; el badge Yonke siempre acompaña costos marcados como estimados.
const estilos = {
  verde: 'bg-wh-green-soft text-wh-green-ink border-wh-green-border',
  ambar: 'bg-wh-amber-soft text-wh-amber-ink border-wh-amber-border',
  naranja: 'bg-wh-orange-soft text-wh-orange-ink border-wh-orange',
  azul: 'bg-wh-blue-soft text-wh-blue-ink border-wh-blue-border',
  neutro: 'bg-wh-chip-neutral text-wh-ink-soft border-[#C9C2B2]',
}

type Tipo = 'criticidad' | 'origen' | 'estadoReq' | 'estadoUnidad' | 'liberacion' | 'neutral'

const color = (tipo: Tipo, valor: string): keyof typeof estilos => {
  switch (tipo) {
    case 'criticidad':
      return valor === 'Crítica' ? 'naranja' : valor === 'Media' ? 'ambar' : 'verde'
    case 'origen':
      return valor === 'Yonke' ? 'naranja' : 'neutro'
    case 'estadoReq':
      return valor === 'Instalado' ? 'verde' : valor === 'Comprado' ? 'azul' : valor === 'Cotizado' ? 'ambar' : 'neutro'
    case 'estadoUnidad':
      return valor === 'Activo' ? 'verde' : valor === 'Yonke' ? 'naranja' : 'neutro'
    case 'liberacion':
      return valor === 'Total' ? 'verde' : 'naranja'
    case 'neutral':
      return 'neutro'
  }
}

export default function Badge({
  tipo,
  valor,
  texto,
}: {
  tipo: Tipo
  valor: string
  texto?: string
}) {
  return (
    <span
      className={`inline-block whitespace-nowrap text-[12px] font-bold px-2.5 py-0.5 rounded-md border ${estilos[color(tipo, valor)]}`}
    >
      {texto ?? valor}
    </span>
  )
}
