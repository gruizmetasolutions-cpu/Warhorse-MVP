import type { CSSProperties } from 'react'

// Camión de firma del demo original (viewBox 200×90).
export default function Camion({
  stroke = '#F2620F',
  strokeWidth = 9,
  conLinea = false,
  style,
}: {
  stroke?: string
  strokeWidth?: number
  conLinea?: boolean
  style?: CSSProperties
}) {
  return (
    <svg viewBox="0 0 200 90" style={style} fill="none" stroke={stroke} strokeWidth={strokeWidth} aria-hidden="true">
      <rect x="8" y="34" width="46" height="30" rx="5" />
      <rect x="58" y="16" width="128" height="48" rx="5" />
      <circle cx="32" cy="72" r="9" />
      <circle cx="92" cy="72" r="9" />
      <circle cx="150" cy="72" r="9" />
      {conLinea && <line x1="8" y1="50" x2="54" y2="50" />}
    </svg>
  )
}
