import { FD } from '../lib/estilos'

// Línea naranja + etiqueta en mayúsculas que encabeza cada vista del original.
export default function Kicker({ texto }: { texto: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
      <span style={{ width: 26, height: 4, background: '#F2620F' }} />
      <span
        style={{
          fontFamily: FD,
          fontWeight: 600,
          fontSize: 13,
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          color: '#F2620F',
        }}
      >
        {texto}
      </span>
    </div>
  )
}
