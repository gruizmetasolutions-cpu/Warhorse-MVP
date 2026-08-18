import { FD } from '../lib/estilos'

// Línea naranja + etiqueta en mayúsculas que encabeza cada vista del original.
export default function Kicker({ texto }: { texto: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
      <span style={{ width: 26, height: 4, background: 'var(--accent-gold)' }} />
      <span
        style={{
          fontFamily: FD,
          fontWeight: 600,
          fontSize: 13,
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          color: 'var(--accent-gold)',
        }}
      >
        {texto}
      </span>
    </div>
  )
}
